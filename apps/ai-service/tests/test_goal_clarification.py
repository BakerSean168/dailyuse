import pytest
from unittest.mock import AsyncMock, patch

from ai_service.errors import StructuredOutputError
from ai_service.schemas.goals import (
    ClarificationQuestion,
    GoalClarificationLLMResponse,
    GoalPlanningResponse,
    PlannedGoal,
)
from ai_service.services.chat_service import ChatService
from ai_service.services.goal_planning_service import GoalPlanningService


class TestGoalClarificationSchemas:
    """Test that clarification schemas validate correctly."""

    def test_clarification_required_schema(self):
        clarification_json = {
            "needsClarification": True,
            "questions": [
                {
                    "question": "What is your motivation?",
                    "context": "Understanding why helps with long-term commitment"
                },
                {
                    "question": "What's your timeline?",
                    "context": None
                }
            ],
            "rationale": "The idea is vague about timing and motivation"
        }

        clari = GoalClarificationLLMResponse.model_validate(clarification_json)
        assert clari.needs_clarification is True
        assert len(clari.questions) == 2
        assert clari.rationale == "The idea is vague about timing and motivation"
        assert clari.questions[0].question == "What is your motivation?"

    def test_clarification_enforces_question_count_bounds(self):
        with pytest.raises(ValueError, match="2-4 questions"):
            GoalClarificationLLMResponse.model_validate(
                {
                    "needsClarification": True,
                    "questions": [
                        {
                            "question": "What exactly do you want to learn first?",
                            "context": None,
                        }
                    ],
                    "rationale": "Need more context",
                }
            )

        with pytest.raises(ValueError, match="2-4 questions"):
            GoalClarificationLLMResponse.model_validate(
                {
                    "needsClarification": True,
                    "questions": [
                        {"question": "Question one?", "context": None},
                        {"question": "Question two?", "context": None},
                        {"question": "Question three?", "context": None},
                        {"question": "Question four?", "context": None},
                        {"question": "Question five?", "context": None},
                    ],
                    "rationale": "Need more context",
                }
            )

    def test_clarification_questions_must_be_non_trivial(self):
        with pytest.raises(ValueError):
            GoalClarificationLLMResponse.model_validate(
                {
                    "needsClarification": True,
                    "questions": [
                        {"question": "", "context": None},
                        {
                            "question": "What timeline are you aiming for?",
                            "context": None,
                        },
                    ],
                    "rationale": "Need more context",
                }
            )

    def test_planning_response_with_clarification(self):
        clari = GoalClarificationLLMResponse(
            needs_clarification=True,
            questions=[
                ClarificationQuestion(question="What outcome are you aiming for?", context=None),
                ClarificationQuestion(question="What timeline are you targeting?", context=None),
            ],
            rationale="Test"
        )
        response = GoalPlanningResponse(
            state="clarification",
            clarification=clari,
            usage={"prompt_tokens": 100}
        )
        assert response.state == "clarification"
        assert response.goal is None

    def test_planning_response_with_draft(self):
        goal = PlannedGoal(
            title="Test Goal",
            description="Test description",
            category="health",
            importance="Important",
            tags=[],
            suggestedStartDate=1000,
            suggestedEndDate=2000,
        )

        response = GoalPlanningResponse(
            state="draft",
            goal=goal,
            keyResults=[],
            usage=None
        )
        assert response.state == "draft"
        assert response.clarification is None


class TestGoalClarificationService:
    """Tests for the goal planning service clarification logic."""

    @pytest.fixture
    def mock_chat_service(self):
        chat_service = AsyncMock(spec=ChatService)
        return chat_service

    @pytest.fixture
    def service(self, mock_chat_service):
        return GoalPlanningService(mock_chat_service)

    @pytest.fixture
    def provider_config(self):
        return {
            "provider": "openai",
            "model": "gpt-4o-mini",
            "api_key": "secret",
        }

    async def test_clarify_returns_clarification_response(self, service, mock_chat_service, provider_config):
        """When LLM returns needsClarification=True, return clarification state."""
        mock_chat_service.complete.return_value.content = '''```json
        {
            "needsClarification": true,
            "questions": [{"question": "Question 1", "context": null}, {"question": "Question 2", "context": null}],
            "rationale": "Vague"
        }
        ```'''
        mock_chat_service.complete.return_value.usage = {"prompt_tokens": 10}

        response = await service.clarify(
            idea="I want to learn something.",
            category=None,
            provider_config=provider_config,
        )

        assert response.state == "clarification"
        assert response.clarification is not None
        assert response.clarification.needs_clarification is True
        assert len(response.clarification.questions) == 2

    async def test_clarify_returns_draft_state(self, service, mock_chat_service, provider_config):
        """When LLM returns needsClarification=False, return draft state."""
        mock_chat_service.complete.return_value.content = '''{
            "needsClarification": false,
            "questions": [],
            "rationale": "Clear enough"
        }'''
        mock_chat_service.complete.return_value.usage = None

        response = await service.clarify(
            idea="I want to learn Python for data science by reading a specific book.",
            category="learning",
            provider_config=provider_config,
        )

        assert response.state == "draft"
        assert response.clarification is None

    async def test_invalid_json_raises_structured_output_error(self, service, mock_chat_service, provider_config):
        """Malformed JSON from provider during clarify should raise StructuredOutputError."""
        mock_chat_service.complete.return_value.content = "not json"

        try:
            await service.clarify(
                idea="test",
                category=None,
                provider_config=provider_config,
            )
        except StructuredOutputError as exc:
            assert exc.detail == "Provider returned invalid JSON for goal clarification."
        else:
            raise AssertionError("StructuredOutputError was not raised")

    async def test_plan_with_clarification_needs_questions(self, service, mock_chat_service, provider_config):
        """When enable_clarification=True and questions are needed, it stops and returns questions."""
        with patch.object(service, "clarify", new_callable=AsyncMock) as mock_clarify:
            mock_clarify.return_value = GoalPlanningResponse(
                state="clarification",
                clarification=GoalClarificationLLMResponse(
                    needs_clarification=True,
                    questions=[
                        ClarificationQuestion(
                            question="What outcome are you aiming for?",
                            context=None,
                        ),
                        ClarificationQuestion(
                            question="What timeline are you targeting?",
                            context=None,
                        ),
                    ],
                    rationale="Test"
                ),
                usage=None
            )

            response = await service.plan_with_clarification(
                idea="test",
                category=None,
                timeframe=None,
                include_key_results=True,
                provider_config=provider_config,
                enable_clarification=True,
                clarification_answers=None
            )

            assert response.state == "clarification"
            # It shouldn't call plan()
            mock_chat_service.complete.assert_not_called()

    async def test_plan_with_clarification_augments_idea(self, service, provider_config):
        """When clarification answers are provided, it augments the idea and calls plan()."""
        with patch.object(service, "plan", new_callable=AsyncMock) as mock_plan:
            mock_plan.return_value = GoalPlanningResponse(
                state="draft",
                goal=PlannedGoal(
                    title="Augmented Goal",
                    description="",
                    category="other",
                    importance="Moderate",
                    tags=[],
                    suggestedStartDate=1,
                    suggestedEndDate=2,
                ),
                keyResults=None,
                usage=None
            )

            response = await service.plan_with_clarification(
                idea="Learn to code",
                category=None,
                timeframe=None,
                include_key_results=True,
                provider_config=provider_config,
                enable_clarification=True,
                clarification_answers=["Python", "3 months"]
            )

            assert response.state == "draft"
            mock_plan.assert_called_once()
            called_kwargs = mock_plan.call_args.kwargs
            assert "Q: Python" in called_kwargs["idea"]
            assert "Q: 3 months" in called_kwargs["idea"]
            assert "Learn to code" in called_kwargs["idea"]
