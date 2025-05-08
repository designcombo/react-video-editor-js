import { useEffect, useState } from "react";
import { nanoid } from "nanoid";

import { test_response } from "./test";
import { buildProject } from "./builder";
import {
  DESIGN_LOAD,
  ADD_IMAGE,
  ADD_VIDEO,
  ADD_AUDIO,
  ADD_TEXT,
} from "@designcombo/state";
import { dispatch } from "@designcombo/events";
import { callMcp } from "../service/api";

//const socket = io("http://localhost:5000");

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    console.log("Conectando al servidor...");
    /*
    setTimeout(() => {
      buildProject(test_response.data).then((project) => {
        console.log("project: ", project);
        dispatch(DESIGN_LOAD, { payload: project });
      });
    }, 2000);
    */
  }, []);

  const sendMessage = async () => {
    const response = await callMcp(input);
    const content = response.content;
    setMessages([...messages, response.messages]);
    if (response.type === "editor") {
      const project = await buildProject(content);
      console.log("project: ", project);
      dispatch(DESIGN_LOAD, { payload: project });
    } else if (response.type === "image") {
      dispatch(ADD_IMAGE, {
        payload: {
          id: nanoid(),
          type: "image",
          details: {
            src: content.src,
          },
          display: content.display,
        },
      });
    } else if (response.type === "video") {
      dispatch(ADD_VIDEO, {
        payload: {
          id: nanoid(),
          type: "video",
          details: {
            src: content.src,
          },
          //metadata: { previewUrl: video.preview },
          display: content.display,
          trim: content.trim,
          duration: content.duration,
        },
      });
    } else if (response.type === "audio") {
      dispatch(ADD_AUDIO, {
        payload: {
          id: nanoid(),
          type: "audio",
          details: {
            src: content.src,
          },
          display: content.display,
          trim: content.trim,
          duration: content.duration,
        },
      });
    } else if (response.type === "text") {
      dispatch(ADD_TEXT, {
        payload: {
          id: nanoid(),
          type: "text",
          details: {
            ...content.details,
            text: content.text,
            /*
            fontFamily: SECONDARY_FONT,
            fontUrl: SECONDARY_FONT_URL,
            fontSize: 90,
            width: 600,
            textAlign: "center",
            */
          },
          display: content.display,
        },
      });
    }
  };

  return (
    <div className="flex flex-col h-full p-4 bg-white text-black">
      <div className="flex-1 overflow-y-auto space-y-2">
        {messages.map((msg, i) => (
          <div key={i}>{msg}</div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 border px-2 py-1 rounded text-black"
          placeholder="Escribe tu mensaje..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
