"""Checkpoint helpers for experimental Agent runtimes."""

from __future__ import annotations

import json
import os
import pickle
from collections import defaultdict
from contextlib import suppress
from pathlib import Path
from threading import RLock
from typing import Any, Protocol, cast

from langgraph.checkpoint.memory import InMemorySaver

from ai_service.schemas import AgentRun, AgentRunResult

CheckpointStorage = defaultdict[
    str,
    dict[str, dict[str, tuple[tuple[str, bytes], tuple[str, bytes], str | None]]],
]
CheckpointWrites = defaultdict[
    tuple[str, str, str],
    dict[tuple[str, int], tuple[str, str, tuple[str, bytes], str]],
]
CheckpointBlobs = dict[tuple[str, str, str, str | int | float], tuple[str, bytes]]


def _quarantine_corrupt_file(path: Path) -> None:
    if not path.exists():
        return
    candidate = path.with_name(f"{path.name}.corrupt")
    suffix = 1
    while candidate.exists():
        candidate = path.with_name(f"{path.name}.corrupt.{suffix}")
        suffix += 1
    with suppress(OSError):
        os.replace(path, candidate)


class AgentRunHistoryPort(Protocol):
    """Persistence boundary for projected Agent run history and snapshots."""

    def upsert_result(self, result: AgentRunResult) -> None: ...

    def list_runs(self) -> list[AgentRun]: ...

    def get_result_by_thread_id(self, *, thread_id: str) -> AgentRunResult | None: ...

    def thread_index(self) -> dict[str, str]: ...


class AgentRunHistoryStore:
    """Persist projected Agent run metadata and serializable snapshots."""

    _FORMAT_VERSION = 1

    def __init__(self, path: str | Path | None = None) -> None:
        self.path = Path(path).expanduser() if path is not None else None
        self._lock = RLock()
        self._runs: dict[str, dict[str, Any]] = {}
        self._results: dict[str, dict[str, Any]] = {}
        self._load()

    def upsert(self, run: AgentRun) -> None:
        with self._lock:
            self._runs[run.run_id] = run.model_dump(by_alias=True)
            self._persist()

    def upsert_result(self, result: AgentRunResult) -> None:
        with self._lock:
            self._runs[result.run.run_id] = result.run.model_dump(by_alias=True)
            self._results[result.run.run_id] = result.model_dump(by_alias=True)
            self._persist()

    def list_runs(self) -> list[AgentRun]:
        with self._lock:
            records = list(self._runs.values())
        return [AgentRun.model_validate(record) for record in records]

    def get_result(self, *, run_id: str) -> AgentRunResult | None:
        with self._lock:
            record = self._results.get(run_id)
        return AgentRunResult.model_validate(record) if record is not None else None

    def get_result_by_thread_id(self, *, thread_id: str) -> AgentRunResult | None:
        with self._lock:
            records = list(self._results.values())
        for record in records:
            run = record.get("run")
            if isinstance(run, dict) and run.get("threadId") == thread_id:
                return AgentRunResult.model_validate(record)
        return None

    def thread_index(self) -> dict[str, str]:
        with self._lock:
            records = list(self._runs.items())
        restored: dict[str, str] = {}
        for run_id, record in records:
            thread_id = record.get("threadId")
            if isinstance(thread_id, str):
                restored[run_id] = thread_id
        return restored

    def _load(self) -> None:
        if self.path is None or not self.path.exists():
            return
        try:
            with self.path.open("r", encoding="utf-8") as handle:
                payload = json.load(handle)
            if payload.get("version") != self._FORMAT_VERSION:
                raise ValueError
        except (AttributeError, OSError, TypeError, ValueError):
            _quarantine_corrupt_file(self.path)
            return

        runs = payload.get("runs", {})
        if isinstance(runs, dict):
            self._runs = {
                run_id: record
                for run_id, record in runs.items()
                if isinstance(run_id, str) and isinstance(record, dict)
            }
        results = payload.get("results", {})
        if isinstance(results, dict):
            self._results = {
                run_id: record
                for run_id, record in results.items()
                if isinstance(run_id, str) and isinstance(record, dict)
            }

    def _persist(self) -> None:
        if self.path is None:
            return
        self.path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "version": self._FORMAT_VERSION,
            "runs": self._runs,
            "results": self._results,
        }
        tmp_path = self.path.with_name(f"{self.path.name}.tmp")
        with tmp_path.open("w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=True, sort_keys=True)
        os.replace(tmp_path, self.path)


class FileBackedInMemorySaver(InMemorySaver):
    """Persist LangGraph's in-memory checkpoint store to one local file.

    This keeps the current graph/checkpoint behavior intact while making the
    experimental Agent runtime recoverable across runtime object recreation.
    It is intentionally small; production storage should move to an official
    LangGraph database-backed saver once that dependency is introduced.
    """

    _FORMAT_VERSION = 1

    def __init__(self, path: str | Path) -> None:
        super().__init__()
        self.path = Path(path).expanduser()
        self._lock = RLock()
        self._load()

    def put(self, config, checkpoint, metadata, new_versions):
        with self._lock:
            result = super().put(config, checkpoint, metadata, new_versions)
            self._persist()
            return result

    def put_writes(
        self,
        config,
        writes,
        task_id: str,
        task_path: str = "",
    ) -> None:
        with self._lock:
            super().put_writes(config, writes, task_id, task_path)
            self._persist()

    def delete_thread(self, thread_id: str) -> None:
        with self._lock:
            super().delete_thread(thread_id)
            self._persist()

    def _load(self) -> None:
        if not self.path.exists():
            return
        try:
            with self.path.open("rb") as handle:
                payload = pickle.load(handle)
            if payload.get("version") != self._FORMAT_VERSION:
                raise ValueError
        except (
            AttributeError,
            OSError,
            EOFError,
            pickle.PickleError,
            TypeError,
            ValueError,
        ):
            _quarantine_corrupt_file(self.path)
            return

        storage: CheckpointStorage = defaultdict(lambda: defaultdict(dict))
        for thread_id, namespaces in payload.get("storage", {}).items():
            storage[thread_id] = defaultdict(
                dict,
                {
                    namespace: dict(checkpoints)
                    for namespace, checkpoints in namespaces.items()
                },
            )
        self.storage = storage
        self.writes = cast(
            CheckpointWrites,
            defaultdict(dict, payload.get("writes", {})),
        )
        self.blobs = cast(CheckpointBlobs, dict(payload.get("blobs", {})))

    def _persist(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "version": self._FORMAT_VERSION,
            "storage": {
                thread_id: {
                    namespace: dict(checkpoints)
                    for namespace, checkpoints in namespaces.items()
                }
                for thread_id, namespaces in self.storage.items()
            },
            "writes": dict(self.writes),
            "blobs": dict(self.blobs),
        }
        tmp_path = self.path.with_name(f"{self.path.name}.tmp")
        with tmp_path.open("wb") as handle:
            pickle.dump(payload, handle, protocol=pickle.HIGHEST_PROTOCOL)
        os.replace(tmp_path, self.path)


def build_file_backed_saver(
    *,
    checkpoint_dir: str | Path | None,
    name: str,
) -> InMemorySaver:
    """Create the configured Agent runtime checkpointer."""

    if checkpoint_dir is None:
        return InMemorySaver()
    return FileBackedInMemorySaver(Path(checkpoint_dir) / f"{name}.pkl")


def build_file_backed_run_history_store(
    *,
    checkpoint_dir: str | Path | None,
    name: str,
) -> AgentRunHistoryStore:
    """Create the configured Agent run history store."""

    if checkpoint_dir is None:
        return AgentRunHistoryStore()
    return AgentRunHistoryStore(Path(checkpoint_dir) / f"{name}-runs.json")
