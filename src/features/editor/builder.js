import { nanoid } from "nanoid";

import { loadVideoItem } from "./utils/vercel/video";
import { loadAudioItem } from "./utils/vercel/audio";
import { loadImageItem } from "./utils/vercel/image";
import {
  avatarTrack,
  captionTrack,
  brollsTrack,
  audioTrack,
} from "./utils/vercel/tracks";
import { generateCaptions } from "./utils/captions";
import { fetchJsonFromUrl, loadFonts } from "./utils/vercel/caption";

export async function buildProject(content) {
    console.log("buildProject: ", content);
    let duration_project = 0;
    const size = {
      width: 1080,
      height: 1920,
    };
    const trackItemDetailsMap = {};
    const trackItemsMap = {};
    const trackItemIds = [];
    let captionItemIds = [];
    for (const data of content) {
      if (data.avatar) {
        const avatarItemId = nanoid();
        const avatarItem = await loadVideoItem(
          {
            id: avatarItemId,
            type: "video",
            details: {
              src: `${data.avatar}?${nanoid()}`,
              volume: 0
            },
            display: {
              from: duration_project,
              to: duration_project + data.duration,
            },
            trim: data.trim,
            duration: data.duration,
            //metadata: { previewUrl: `https://cdn.subgen.co/${uploadedMedia.metadata.previewPath}` },
          },
          {
            size,
            scaleMode: "fit",
          }
        );
        avatarTrack.items.push(avatarItemId);
        trackItemDetailsMap[avatarItemId] = {
          type: "video",
          details: avatarItem.details,
          metadata: avatarItem.metadata,
        };
        trackItemsMap[avatarItemId] = avatarItem;
        trackItemIds.push(avatarItemId);
      }
      if (data.voiceover) {
        const audioItemId = nanoid();

        const audioItem = await loadAudioItem(
          {
            id: audioItemId,
            type: "audio",
            details: {
              src: `${data.voiceover}?${nanoid()}`,
            },
            display: {
              from: duration_project,
              to: duration_project + data.duration,
            },
            duration: data.duration,
          }
        );

        audioTrack.items.push(audioItemId);
        trackItemDetailsMap[audioItemId] = {
          type: "audio",
          details: audioItem.details,
        };
        trackItemsMap[audioItemId] = audioItem;
        trackItemIds.push(audioItemId);
        /*
        if (data.caption) {
          const jsonData = await fetchJsonFromUrl(data.caption);
          const fontInfo = {
            fontFamily: "theboldfont",
            fontUrl: "https://cdn.designcombo.dev/fonts/the-bold-font.ttf",
            fontSize: 60,
          };
          const options = {
            containerWidth: 600,
            linesPerCaption: 2,
            parentId: audioItemId,
            displayFrom: 0,
          };

          await loadFonts([
            { name: fontInfo.fontFamily, url: fontInfo.fontUrl },
          ]);
          const captions = generateCaptions(
            { ...jsonData, sourceUrl: data.voiceover },
            fontInfo,
            options,
            size
          );
          captionItemIds = captions.map((caption) => caption.id);

          captions.forEach((caption) => {
            trackItemDetailsMap[caption.id] = {
              type: "caption",
              details: caption.details,
              metadata: caption.metadata,
            };
          });
          captions.forEach((caption) => {
            trackItemsMap[caption.id] = caption;
          });
          captionTrack.items = captionTrack.items.concat(captionItemIds);
        }
        */
      }

      let duration_media = duration_project;
      for (const media of data.media) {
        if (media.type === "video") {
          const brollItemId = nanoid();
          const brollItem = await loadVideoItem(
            {
              id: brollItemId,
              type: "video",
              details: {
                src: `${media.url}?${nanoid()}`,
                volume: 0
              },
              display: {
                from: duration_media,
                to: duration_media + media.duration,
              },
              trim: media.trim,
              duration: media.duration,
              //metadata: { previewUrl: `https://cdn.subgen.co/${uploadedMedia.metadata.previewPath}` },
            },
            {
              size,
              scaleMode: "fit",
            }
          );
          brollsTrack.items.push(brollItemId);
          trackItemDetailsMap[brollItemId] = {
            type: "video",
            details: brollItem.details,
            metadata: brollItem.metadata,
          };
          trackItemsMap[brollItemId] = brollItem;
          trackItemIds.push(brollItemId);

          duration_media = duration_media + media.duration;
        } else if (media.type === "image") {
          const brollItemId = nanoid();
          const brollItem = await loadImageItem(
            {
              id: brollItemId,
              type: "image",
              details: {
                src: `${media.url}?${nanoid()}`,
              },
              display: {
                from: duration_media,
                to: duration_media + media.duration,
              },
              duration: media.duration,
              width: media.width,
              height: media.height,
            },
            {
              size,
              scaleMode: "fit",
            }
          );
          brollsTrack.items.push(brollItemId);
          trackItemDetailsMap[brollItemId] = {
            type: "image",
            details: brollItem.details,
            metadata: brollItem.metadata,
          };
          trackItemsMap[brollItemId] = brollItem;
          trackItemIds.push(brollItemId);

          duration_media = duration_media + media.duration;
        }
      }

      duration_project += data.duration;
    }

    const project = {
      id: nanoid(),
      fps: 30,
      tracks: [avatarTrack,
        captionTrack,
        brollsTrack,
        audioTrack
      ],
      size,
      trackItemDetailsMap,
      //trackItemIds: [...trackItemIds, ...captionItemIds],
      trackItemIds,
      transitionsMap: {},
      trackItemsMap,
      transitionIds: [],
    };

    return project;
}