
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  loading: boolean;
  onSend: (text: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ loading, onSend }) => {
  const [input, setInput] = useState("");

  return (
    <form
      className="flex gap-2"
      onSubmit={e => {
        e.preventDefault();
        if (input.trim()) {
          onSend(input.trim());
          setInput("");
        }
      }}
    >
      <Input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Type your message..."
        disabled={loading}
      />
      <Button type="submit" disabled={loading || !input.trim()}>
        Send
      </Button>
    </form>
  );
};

export default ChatInput;
