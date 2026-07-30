import { renderWithProviders, screen, waitFor } from "../../../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import AddAutoRouterTab from "./add_auto_router_tab";
import NotificationManager from "../molecules/notifications_manager";
import { ModelGroup } from "@/components/llm_calls/fetch_models";

const { mockFetchAvailableModels, mockHandleAddAutoRouterSubmit } = vi.hoisted(() => ({
  mockFetchAvailableModels: vi.fn(),
  mockHandleAddAutoRouterSubmit: vi.fn(),
}));

vi.mock("../networking", () => ({
  modelAvailableCall: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: mockFetchAvailableModels,
}));

vi.mock("./handle_add_auto_router_submit", () => ({
  handleAddAutoRouterSubmit: mockHandleAddAutoRouterSubmit,
}));

vi.mock("../molecules/notifications_manager", () => ({
  default: { fromBackend: vi.fn() },
}));

const Harness = ({ onOk = vi.fn() }: { onOk?: () => void } = {}) => (
  <AddAutoRouterTab handleOk={onOk} accessToken="token" userRole="Admin" />
);

describe("AddAutoRouterTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchAvailableModels.mockResolvedValue([]);
    mockHandleAddAutoRouterSubmit.mockResolvedValue(undefined);
  });

  it("flags every mandatory field when Add Auto Router is clicked with nothing filled", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await user.click(screen.getByRole("button", { name: /add auto router/i }));

    expect(await screen.findByText("Auto router name is required")).toBeInTheDocument();
    expect(screen.getAllByText("This tier is required")).toHaveLength(4);
    expect(NotificationManager.fromBackend).toHaveBeenCalledWith("Please enter an Auto Router Name");
  });

  it("renders template selector as the first control", async () => {
    renderWithProviders(<Harness />);

    const templateSelector = screen.getByTestId("template-selector");
    expect(templateSelector).toBeInTheDocument();

    const templateLabel = screen.getByText("Template");
    const nameLabel = screen.getByText("Auto Router Name");

    expect(templateLabel.compareDocumentPosition(nameLabel)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("renders the selector once both model families are fully available", async () => {
    const availableModels: ModelGroup[] = [
      { model_group: "claude-haiku-4-5", mode: "chat" },
      { model_group: "claude-sonnet-4-5", mode: "chat" },
      { model_group: "claude-opus-5", mode: "chat" },
      { model_group: "gpt-5-nano", mode: "chat" },
      { model_group: "gpt-5-mini", mode: "chat" },
      { model_group: "gpt-5", mode: "chat" },
      { model_group: "o3", mode: "chat" },
    ];
    mockFetchAvailableModels.mockResolvedValue(availableModels);

    renderWithProviders(<Harness />);
    await waitFor(() => expect(mockFetchAvailableModels).toHaveBeenCalled());

    const selector = screen.getByTestId("template-selector");
    expect(selector).toBeInTheDocument();
  });

  it("still renders the selector when the caller has neither model family", async () => {
    const limitedModels: ModelGroup[] = [{ model_group: "some-other-model", mode: "chat" }];
    mockFetchAvailableModels.mockResolvedValue(limitedModels);

    renderWithProviders(<Harness />);
    await waitFor(() => expect(mockFetchAvailableModels).toHaveBeenCalled());

    const selector = screen.getByTestId("template-selector");
    expect(selector).toBeInTheDocument();
  });
});
