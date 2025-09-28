export default function ChatbotPlaceholder() {
  return (
    <div className="flex flex-col h-full bg-card p-4 rounded-lg border border-border shadow-lg">
      <h2 className="text-xl font-semibold mb-4">AI Chatbot (OpenAI)</h2>
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-center">
        <p>Chatbot integration coming soon!</p>
      </div>
      <div className="mt-4">
        <input
          type="text"
          placeholder="Type your message..."
          className="input w-full"
          disabled
        />
        <button className="btn w-full mt-2" disabled>
          Send
        </button>
      </div>
    </div>
  );
}
