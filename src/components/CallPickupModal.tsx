
import { Button } from "@/components/ui/button";
import { PhoneCall, PhoneOff, Video, VideoOff } from "lucide-react";

interface CallPickupModalProps {
  isOpen: boolean;
  callerName: string;
  onAccept: () => void;
  onDecline: () => void;
}

const CallPickupModal = ({ isOpen, callerName, onAccept, onDecline }: CallPickupModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-10 h-10 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Incoming Video Call</h3>
          <p className="text-gray-600">{callerName} is calling you</p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button
            onClick={onDecline}
            variant="destructive"
            size="lg"
            className="flex items-center gap-2 rounded-full w-16 h-16 p-0"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
          
          <Button
            onClick={onAccept}
            className="flex items-center gap-2 rounded-full w-16 h-16 p-0 bg-green-600 hover:bg-green-700"
          >
            <PhoneCall className="w-6 h-6" />
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Accept to start video call
        </p>
      </div>
    </div>
  );
};

export default CallPickupModal;
