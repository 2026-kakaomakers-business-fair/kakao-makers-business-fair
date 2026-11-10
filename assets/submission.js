// The Apps Script endpoint stores proposals; GitHub Pages keeps the visible UI.
(() => {
  const endpoint = 'https://script.google.com/macros/s/AKfycbyo0yfivZgPkyRa9Oqsa44MDVa0sCAAJI884DxXLMnnz08FS1AkjwJGNsCTRba1jig7ng/exec';
  const allowedOrigin = 'https://lilyhw-commits.github.io';
  const messageType = 'makers-proposal-result';
  const connectionError = '저장 결과를 확인하지 못했어요. 잠시 후 다시 제출해 주세요. 입력 내용은 유지됩니다.';

  function attachmentData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({name: file.name, base64: String(reader.result).split(',')[1]});
      reader.onerror = () => reject(new Error('첨부파일을 다시 선택해 주세요.'));
      reader.readAsDataURL(file);
    });
  }

  window.sendProposal = async (data, files) => {
    if (window.location.origin !== allowedOrigin) throw new Error('공식 입점 제안 페이지에서 다시 제출해 주세요.');
    const payload = Object.fromEntries([...data.entries()].filter(([key]) => key !== 'attachments'));
    payload.consent = data.get('consent') === 'on';
    payload.attachments = await Promise.all(files.map(attachmentData));
    const nonce = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      const frame = document.createElement('iframe');
      frame.name = 'makers-submit-' + nonce;
      frame.title = '입점 제안 저장';
      frame.hidden = true;
      const transport = document.createElement('form');
      transport.method = 'POST';
      transport.action = endpoint;
      transport.target = frame.name;
      transport.hidden = true;
      const fields = {payload: JSON.stringify(payload), responseMode: 'github', nonce};
      for (const [name, value] of Object.entries(fields)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        transport.append(input);
      }

      let timer;
      function finish(error, result) {
        clearTimeout(timer);
        window.removeEventListener('message', onMessage);
        frame.remove();
        transport.remove();
        if (error) reject(error);
        else resolve(result);
      }
      function onMessage(event) {
        // HtmlService runs in a nested, Google-hosted iframe, not the outer frame.
        if (!/^https:\/\/[a-z0-9-]+-script\.googleusercontent\.com$/.test(event.origin)) return;
        const message = event.data;
        if (!message || message.type !== messageType || message.nonce !== nonce || message.requestId !== payload.requestId) return;
        const result = message.result;
        if (result?.ok === true && /^MK-\d{8}-\d{4,}$/.test(result.receipt || '')) finish(null, result);
        else finish(new Error(typeof result?.error === 'string' ? result.error : connectionError));
      }

      window.addEventListener('message', onMessage);
      timer = setTimeout(() => finish(new Error(connectionError)), 120000);
      document.body.append(frame, transport);
      try {
        // A regular form POST avoids CORS; success requires the server's receipt.
        transport.submit();
      } catch (_) {
        finish(new Error(connectionError));
      }
    });
  };
})();
