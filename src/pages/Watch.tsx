
import { useParams } from "react-router-dom";
import LivestreamViewer from "@/components/LivestreamViewer";
import StreamAccessChecker from "@/components/StreamAccessChecker";

const Watch = () => {
  const { streamId } = useParams<{ streamId: string }>();

  if (!streamId) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Stream Not Found</h1>
        <p className="text-gray-600">The requested stream could not be found.</p>
      </div>
    );
  }

  return (
    <StreamAccessChecker streamId={streamId}>
      <LivestreamViewer streamId={streamId} creatorId="" />
    </StreamAccessChecker>
  );
};

export default Watch;
