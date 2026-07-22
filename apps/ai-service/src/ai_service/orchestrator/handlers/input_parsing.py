from __future__ import annotations

from typing import TypeVar

from pydantic import BaseModel

from ai_service.schemas.chat import ProviderConfig
from ai_service.schemas.knowledge import KnowledgeNoteDocument

ModelT = TypeVar("ModelT", bound=BaseModel)


def parse_required_model(
    raw: object, model_type: type[ModelT], field_name: str
) -> ModelT:
    if isinstance(raw, model_type):
        return raw

    if isinstance(raw, dict):
        return model_type.model_validate(raw)

    raise TypeError(f"{field_name} must be a {model_type.__name__} or dict payload.")


def parse_optional_model(
    raw: object | None, model_type: type[ModelT], field_name: str
) -> ModelT | None:
    if raw is None:
        return None

    return parse_required_model(raw, model_type, field_name)


def parse_model_list(
    raw: object, model_type: type[ModelT], field_name: str
) -> list[ModelT]:
    if raw is None:
        return []

    if not isinstance(raw, list):
        raise TypeError(f"{field_name} must be a list of {model_type.__name__} values.")

    return [
        parse_required_model(item, model_type, f"{field_name}[{index}]")
        for index, item in enumerate(raw)
    ]


def parse_provider_config(raw: object) -> ProviderConfig:
    return parse_required_model(raw, ProviderConfig, "provider_config")


def parse_optional_provider_config(raw: object | None) -> ProviderConfig | None:
    return parse_optional_model(raw, ProviderConfig, "provider_config")


def parse_knowledge_note(raw: object) -> KnowledgeNoteDocument:
    return parse_required_model(raw, KnowledgeNoteDocument, "resource")


def parse_knowledge_note_list(raw: object) -> list[KnowledgeNoteDocument]:
    return parse_model_list(raw, KnowledgeNoteDocument, "related_resources")
