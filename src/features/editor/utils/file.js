export const getBlobFromUrl = async (url) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return blob;
};

export const getFileFromUrl = async (url) => {
  const response = await fetch(url);
  const blob = await response.blob();
  const filename = url.split("/").pop() || "video.mp4";
  const file = new File([blob], filename);
  return file;
};

export const fileToBlob = async (file) => {
  const blob = await new Response(file.stream()).blob();
  return blob;
};

export const blobToStream = async (blob) => {
  const file = new File([blob], "video.mp4");
  const stream = file.stream();
  return stream;
};

export const getStreamFromUrl = async (url) => {
  const response = await fetch(url);
  const blob = await response.blob();
  const file = new File([blob], "video.mp4");
  const stream = file.stream();
  return stream;
};
