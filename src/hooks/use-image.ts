import { ref, watchEffect } from 'vue';

interface ImageCache {
  [url: string]: string;
}

export function useImage(url: string): Ref<string | null> {
  const image = ref<string | null>('');
  console.log({ url });

  fetch(url).then((response) => {
    console.log(response);
    response.blob().then((blob) => {
      console.log(blob);
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result;
        console.log(base64data); // 打印 base64 编码字符串
        image.value = base64data as string;
      };
    });
  });
  // .then((blob) => {
  //   const reader = new FileReader();
  //   reader.readAsDataURL(blob);
  //   reader.onloadend = () => {
  //     const base64data = reader.result;
  //     console.log(base64data); // 打印 base64 编码字符串
  //     image.value = base64data as string;
  //   };
  // })
  // .catch((error) => console.error({ error }));

  return image;
}
