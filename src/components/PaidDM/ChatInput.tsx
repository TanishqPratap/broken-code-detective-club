
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface ChatInputProps {
  loading: boolean;
  onSend: (text: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ loading, onSend }) => {
  const [input, setInput] = useState("");

  return (
    <form
      className="flex gap-2 items-center"
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
        placeholder="Message..."
        disabled={loading}
        className="flex-1 rounded-full border-gray-200 focus:border-purple-300 focus:ring-purple-300"
      />
      <Button 
        type="submit" 
        disabled={loading || !input.trim()}
        size="sm"
        className="rounded-full w-10 h-10 p-0"
      >
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
};

export default ChatInput;
