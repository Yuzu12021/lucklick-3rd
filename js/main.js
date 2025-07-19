
document.addEventListener('DOMContentLoaded', () => {
  // ハンバーガーメニュー開閉
  const menuButton = document.getElementById('menuButton');
  const navMenu = document.getElementById('navMenu');

  menuButton?.addEventListener('click', () => {
    menuButton.classList.toggle('open');
    navMenu.classList.toggle('show');
  });

  navMenu?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuButton.classList.remove('open');
      navMenu.classList.remove('show');
    });
  });

  // ロゴクリックでページトップにスクロール
  const logo = document.getElementById('logo');
  if (logo) {
    logo.addEventListener('click', (e) => {
      e.preventDefault();
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ✅ スライドイン用Observer
  const slideInObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        slideInObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.box2-left, .box2-right').forEach(el => slideInObserver.observe(el));

   // ✅ アンダーライン用Observer
  const underlineObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        underlineObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.underline-animate, .underline-bg').forEach(heading => underlineObserver.observe(heading));

  // ✅ スライドショー
  document.querySelectorAll('.slideshow-container').forEach(container => {
    const slides = container.querySelectorAll('.slideshow-slide');
    if (slides.length <= 1) return;

    let current = 0;

    function showNextSlide() {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }

    setInterval(showNextSlide, 4000);
  });
});


  // --------------------------
// フォーム処理ここから
// --------------------------
const form = document.getElementById('photoForm');
const confirmButton = document.getElementById('confirmButton');
const backButton = document.getElementById('backButton');
const submitButton = document.getElementById('submitButton');
const confirmSection = document.getElementById('confirmSection');
const preview = document.getElementById('preview');
const confirmImage = document.getElementById('confirmImage');
const confirmData = document.getElementById('confirmData');
const photoInput = document.getElementById('photoInput');
const zoomSlider = document.getElementById('zoomSlider');
const cropperWrapper = document.getElementById('cropperWrapper');

let cropper;
let croppedBlob;

// 写真アップロード時
photoInput.addEventListener('change', () => {
  const file = photoInput.files[0];
  if (file) {
    console.log("📷 ファイル選択:", file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
  console.log("🖼️ 画像読み込み完了");
  preview.src = reader.result; // ✅ この行だけでOK

  preview.classList.remove('hidden');
  cropperWrapper.classList.remove('hidden');

  console.log("📐 Cropper初期化中...");
  if (cropper) cropper.destroy();
  cropper = new Cropper(preview, {
    aspectRatio: 3 / 2,
    viewMode: 1,
    autoCropArea: 1,
    dragMode: 'move',
    zoomable: true,
    scalable: false,
    cropBoxMovable: false,
    cropBoxResizable: false,
    background: false,
    guides: false,
    responsive: true
  });

  setTimeout(() => {
    cropper.zoomTo(1);
    zoomSlider.value = 1;
    console.log("✅ Cropper準備完了");
  }, 100);
};

      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  } else {
    console.log("⚠️ ファイル未選択");
    preview.classList.add('hidden');
    cropperWrapper.classList.add('hidden');
  }
});


// ズームスライダー操作
zoomSlider?.addEventListener('input', (e) => {
  const zoom = parseFloat(e.target.value);
  if (cropper) {
    cropper.zoomTo(zoom);
  }
});

// 確認画面へ
confirmButton.addEventListener('click', () => {
  if (!cropper) {
    alert("画像をアップロードしてトリミングしてください。");
    return;
  }

  // 必須入力のチェック
  const requiredFields = [
    { id: 'dogName', label: 'わんちゃんの名前' },
    { id: 'zip', label: '郵便番号' },
    { id: 'address', label: '住所' },
    { id: 'ownerName', label: '飼い主様のお名前' },
    { id: 'furigana', label: '飼い主様のフリガナ' }
  ];

  for (const field of requiredFields) {
    const value = form[field.id].value.trim();
    if (!value) {
      alert(`${field.label}は必須です。`);
      return;
    }
  }

  // 電話番号かメールアドレスのいずれかが必要
  const tel = form.tel.value.trim();
  const email = form.email.value.trim();
  if (!tel && !email) {
    alert("電話番号かメールアドレスのどちらかを入力してください。");
    return;
  }

  // 以下、確認画面への遷移処理（既存のままでOK）
  cropper.getCroppedCanvas().toBlob(blob => {
    croppedBlob = blob;

    const data = {
      タイトル: form.title.value,
      名前: form.dogName.value,
      年齢: form.dogAge.value,
      郵便番号: form.zip.value,
      住所: form.address.value,
      電話番号: form.tel.value,
      メール: form.email.value,
      飼い主: form.ownerName.value,
      フリガナ: form.furigana.value
    };

    let html = '';
    for (const key in data) {
      html += `<p><strong>${key}：</strong>${data[key]}</p>`;
    }
    confirmData.innerHTML = html;
    confirmImage.src = URL.createObjectURL(blob);

    form.style.display = 'none';
    confirmSection.style.display = 'block';
  }, 'image/jpeg');
});


// 戻る
backButton.addEventListener('click', () => {
  confirmSection.style.display = 'none';
  form.style.display = 'block';
  preview.src = '';
  preview.classList.add('hidden');
  cropperWrapper.classList.add('hidden');

  if (cropper) {
    cropper.destroy();
    cropper = null;
  }

  zoomSlider.value = 1;
});

// 送信処理
submitButton.addEventListener('click', () => {
  const formData = new FormData();
  formData.append('title', form.title.value);
  formData.append('dogName', form.dogName.value);
  formData.append('dogAge', form.dogAge.value);
  formData.append('ownerPostal', form.zip.value);
  formData.append('ownerAddress', form.address.value);
  formData.append('ownerPhone', form.tel.value);
  formData.append('ownerEmail', form.email.value);
  formData.append('ownerName', form.ownerName.value);
  formData.append('ownerKana', form.furigana.value);

  if (croppedBlob) {
    formData.append('photo', croppedBlob, 'cropped.jpg');
  } else {
    alert('画像のトリミングが完了していません。');
    return;
  }

  fetch('/submit', {
    method: 'POST',
    body: formData
  })
  .then(res => res.text())
  .then(text => {
    alert(text);
    window.location.reload();
  })
  .catch(err => {
    console.error(err);
    alert('送信に失敗しました。');
  });
});

document.getElementById('fetchAddressButton').addEventListener('click', () => {
  const zip = document.getElementById('zip').value.replace('-', '');
  if (!/^\d{7}$/.test(zip)) {
    alert('郵便番号は7桁の数字で入力してください。');
    return;
  }

  fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`)
    .then(response => response.json())
    .then(data => {
      if (data && data.results && data.results[0]) {
        const result = data.results[0];
        document.getElementById('address').value =
          result.address1 + result.address2 + result.address3;
      } else {
        alert('住所が見つかりませんでした。');
      }
    })
    .catch(err => {
      console.error('住所検索エラー', err);
      alert('住所取得に失敗しました。');
    });
});

const agreeCheckbox = document.getElementById('agreeCheckbox');

agreeCheckbox.addEventListener('change', () => {
  confirmButton.disabled = !agreeCheckbox.checked;
});
