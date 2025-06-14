
import React, { useEffect, useState } from 'react';
import {
  Call,
  CallControls,
  CallParticipantsList,
  SpeakerLayout,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { Button } from '@/components/ui/button';
import { PhoneOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StreamVideoCallProps {
  callId: string;
  onCallEnd: () => void;
  isInitiator: boolean;
}

const StreamVideoCall: React.FC<StreamVideoCallProps> = ({ 
  callId, 
  onCallEnd, 
  isInitiator 
}) => {
  const client = useStreamVideoClient();
  const [call, setCall] = useState<Call | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!client) return;

    const initCall = async () => {
      try {
        setIsJoining(true);
        
        const newCall = client.call('default', callId);
        setCall(newCall);

        if (isInitiator) {
          // Create and join the call as initiator
          await newCall.getOrCreate({
            data: {
              members: [{ user_id: client.user.id }],
            },
          });
        } else {
          // Join existing call
          await newCall.get();
        }

        await newCall.join({ create: isInitiator });
        
        toast({
          title: "Video Call",
          description: isInitiator ? "Call started successfully" : "Joined call successfully",
        });
      } catch (error) {
        console.error('Failed to initialize call:', error);
        toast({
          title: "Call Error",
          description: "Failed to start video call. Please try again.",
          variant: "destructive",
        });
        onCallEnd();
      } finally {
        setIsJoining(false);
      }
    };

    initCall();

    return () => {
      if (call) {
        call.leave();
      }
    };
  }, [client, callId, isInitiator, onCallEnd, toast]);

  const handleEndCall = async () => {
    if (call) {
      await call.leave();
    }
    onCallEnd();
  };

  if (isJoining) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">
            {isInitiator ? "Starting Video Call..." : "Joining Video Call..."}
          </h3>
        </div>
      </div>
    );
  }

  if (!call) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Video Call</h3>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleEndCall}
            className="flex items-center gap-2"
          >
            <PhoneOff className="w-4 h-4" />
            End Call
          </Button>
        </div>

        {/* Video Layout */}
        <div className="flex-1 relative">
          <SpeakerLayout participantsBarPosition="bottom" />
        </div>

        {/* Call Controls */}
        <div className="bg-gray-900 p-4">
          <CallControls />
        </div>

        {/* Participants List */}
        <div className="absolute right-4 top-20 w-64 max-h-96 overflow-y-auto">
          <CallParticipantsList onClose={() => {}} />
        </div>
      </div>
    </div>
  );
};

export default StreamVideoCall;
