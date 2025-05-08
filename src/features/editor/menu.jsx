import { useState } from "react";
import { Button } from "@/components/ui/button";
import { dispatch } from "@designcombo/events";
import { ADD_AUDIO, ADD_IMAGE, ADD_TEXT, ADD_VIDEO } from "@designcombo/state";
import { AUDIOS } from "./data/audio";
import { VIDEOS } from "./data/video";
import { IMAGES } from "./data/images";
import { nanoid } from "nanoid";
import { SECONDARY_FONT, SECONDARY_FONT_URL } from "./constants/constants";
import ChatPanel from "./chat_panel"; // Asegúrate de que la ruta sea correcta

export default function Menu() {
  const [showChat, setShowChat] = useState(false);

  const handleAddAudio = () => {
    dispatch(ADD_AUDIO, {
      payload: {
        id: nanoid(),
        type: "audio",
        details: {
          src: AUDIOS[0].details.src,
        },
      },
    });
  };

  const handleAddText = () => {
    dispatch(ADD_TEXT, {
      payload: {
        id: nanoid(),
        type: "text",
        details: {
          text: "Hello World",
          fontFamily: SECONDARY_FONT,
          fontUrl: SECONDARY_FONT_URL,
          fontSize: 90,
          width: 600,
          textAlign: "center",
        },
      },
    });
  };

  const handleAddVideo = () => {
    const video = VIDEOS[0];
    dispatch(ADD_VIDEO, {
      payload: {
        id: nanoid(),
        type: "video",
        details: {
          src: video.details.src,
        },
        metadata: {
          previewUrl: video.preview,
        },
      },
    });
  };

  const handleAddImage = () => {
    dispatch(ADD_IMAGE, {
      payload: {
        id: nanoid(),
        type: "image",
        details: {
          src: IMAGES[0].details.src,
        },
      },
    });
  };

  return (
    <div className="w-60 bg-sidebar">
      {showChat ? (
        <ChatPanel />
      ) : (
        <>
          <div className="px-4 mt-4 text-muted-foreground">Add Items</div>
          <div className="space-y-2 p-4">
            <Button onClick={handleAddText} variant="secondary" className="w-full cursor-pointer">
              Add Text
            </Button>
            <Button onClick={handleAddImage} variant="secondary" className="w-full cursor-pointer">
              Add Image
            </Button>
            <Button onClick={handleAddAudio} variant="secondary" className="w-full cursor-pointer">
              Add Audio
            </Button>
            <Button onClick={handleAddVideo} variant="secondary" className="w-full cursor-pointer">
              Add Video
            </Button>
            <Button onClick={() => setShowChat(true)} variant="secondary" className="w-full cursor-pointer">
              Ai Chat
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
