export const doRecaptcha = async(key:string): Promise<string> => {
  return new Promise<string>((res, rej) => {
    // @ts-ignore
    const captcha: Captcha = grecaptcha;
    captcha.ready(function () {
      captcha.execute(key, {action: "submit"}).then(function (t) {
        return res(t);
      }).catch(rej);
    });
  });
}
