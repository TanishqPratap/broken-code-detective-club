
import React from "react";

interface VideoCallLoadingScreenProps {
  isRequesting: boolean;
  permissionError: string | null;
  onRetry: () => void;
  onCancel: () => void;
}

const VideoCallLoadingScreen: React.FC<VideoCallLoadingScreenProps> = ({
  isRequesting,
  permissionError,
  onRetry,
  onCancel,
}) => {
  // Show loading screen during initial setup
  if (isRequesting) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Setting Up Video Call</h3>
          <p className="text-gray-600 mb-4">Requesting camera and microphone permissions...</p>
          <p className="text-sm text-gray-500">
            Please allow access when prompted by your browser
          </p>
        </div>
      </div>
    );
  }

  // Show error if media permissions failed
  if (permissionError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Media Access Required</h3>
          <p className="text-gray-600 mb-4">{permissionError}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Try Again
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default VideoCallLoadingScreen;
