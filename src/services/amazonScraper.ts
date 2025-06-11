import fetch from 'node-fetch';
import puppeteer from 'puppeteer';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

if (!process.env.KEEPA_API_KEY) {
  process.env.KEEPA_API_KEY = '2hopk7hjqiebik9sl6gog6bmeauahn6u05j6psjvmimrui68h6aefbg1d6486t0c';
}

export async function scrapeAmazonByASIN(asin: string) {
  const url = `https://www.amazon.co.jp/dp/${asin}`;
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // 商品名
  const title = await page.$eval('#productTitle', (el: any) => el.textContent ? el.textContent.trim() : '');

  // メイン画像URL
  const imageUrl = await page.$eval('#imgTagWrapperId img', (img: any) => img.src);

  // 新品最安値
  let newPrice = null;
  try {
    newPrice = await page.$eval('.a-price-whole', (el: any) => el.textContent ? el.textContent.replace(/[^\d]/g, '') : null);
  } catch {}
  if (!newPrice) {
    try {
      newPrice = await page.$eval('.a-price .a-offscreen', (el: any) => el.textContent ? el.textContent.replace(/[^\d]/g, '') : null);
    } catch {}
  }
  if (!newPrice) {
    try {
      newPrice = await page.$eval('#priceblock_ourprice', (el: any) => el.textContent ? el.textContent.replace(/[^\d]/g, '') : null);
    } catch {}
  }
  if (!newPrice) {
    try {
      newPrice = await page.$eval('#priceblock_dealprice', (el: any) => el.textContent ? el.textContent.replace(/[^\d]/g, '') : null);
    } catch {}
  }

  // 中古カート価格
  let usedCartPrice = null;
  try {
    // 1. Amazonページ上の「中古品」セクション
    usedCartPrice = await page.$eval('#olp-upd-new-used .a-price-whole', (el: any) => el.textContent ? el.textContent.replace(/[^\d]/g, '') : null);
  } catch {}
  if (!usedCartPrice) {
    try {
      // 2. オファーページ遷移後の最安値
      const usedLink = await page.$('a[href*="/gp/offer-listing/"]');
      if (usedLink) {
        const href = await usedLink.evaluate((el: any) => el.getAttribute('href'));
        if (href) {
          const usedUrl = href.startsWith('http') ? href : `https://www.amazon.co.jp${href}`;
          await page.goto(usedUrl, { waitUntil: 'domcontentloaded' });
          usedCartPrice = await page.$eval('.a-price-whole', (el: any) => el.textContent ? el.textContent.replace(/[^\d]/g, '') : null);
        }
      }
    } catch {}
  }
  if (!usedCartPrice) {
    try {
      // 3. クイックショップ拡張や新レイアウト
      usedCartPrice = await page.$eval('.qs-value', (el: any) => {
        const m = el.textContent.match(/([\d,]+)円/);
        return m ? m[1].replace(/,/g, '') : null;
      });
    } catch {}
  }
  if (!usedCartPrice) {
    try {
      // 4. 通常の中古価格
      usedCartPrice = await page.$eval('.olp-used .a-color-price', (el: any) => el.textContent ? el.textContent.replace(/[^\d]/g, '') : null);
    } catch {}
  }
  if (!usedCartPrice) {
    try {
      // 5. BuyBoxやリスト形式
      usedCartPrice = await page.$eval('.a-unordered-list.a-nostyle.a-horizontal.list-buybox .a-price .a-offscreen', (el: any) => el.textContent ? el.textContent.replace(/[^\d]/g, '') : null);
    } catch {}
  }
  if (!usedCartPrice) {
    try {
      // 6. KeepaのWebページから取得
      const keepaUrl = `https://keepa.com/#!product/5-${asin}`;
      const keepaPage = await browser.newPage();
      await keepaPage.goto(keepaUrl, { waitUntil: 'domcontentloaded' });
      // 例: <span>¥ 12,980</span> の最初の価格を取得
      usedCartPrice = await keepaPage.$$eval('span', (spans: any[]) => {
        for (const el of spans) {
          const m = el.textContent.match(/¥\s?([\d,]+)/);
          if (m) return m[1].replace(/,/g, '');
        }
        return null;
      });
      await keepaPage.close();
    } catch {}
  }

  // ランキング
  let rank = null;
  try {
    rank = await page.$eval('#SalesRank', (el: any) => el.textContent ? el.textContent.match(/([\d,]+)位/)[1] : null);
  } catch {}

  await browser.close();

  return {
    title,
    imageUrl,
    newPrice,
    usedCartPrice,
    rank
  };
}

/**
 * ASINを渡すとAmazon.co.jpの「中古品＆新品」セクションから最安中古価格を取得する
 * @param {string} asin
 * @returns {Promise<{ value: number|null, currency: string|null }>} 例: { value: 1234, currency: '¥' }
 */
export async function fetchUsedPrice(asin: string): Promise<{ value: number|null, currency: string|null }> {
  const url = `https://www.amazon.co.jp/dp/${asin}`;
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  let value: number|null = null;
  let currency: string|null = null;
  try {
    // 「中古品＆新品」セクションの最安中古価格を取得
    // 例: <span class="a-price-whole">1,234</span> <span class="a-price-symbol">¥</span>
    const priceElement = await page.$('.a-unordered-list.a-nostyle.a-horizontal.list-buybox .a-price');
    if (priceElement) {
      const priceText = await priceElement.$eval('.a-price-whole', el => el.textContent ? el.textContent.trim() : '');
      const currencyText = await priceElement.$eval('.a-price-symbol', el => el.textContent ? el.textContent.trim() : '');
      value = priceText ? parseInt(priceText.replace(/[,\s]/g, ''), 10) : null;
      currency = currencyText ? currencyText.trim() : null;
    } else {
      // 旧レイアウトや見つからない場合のフォールバック: 「中古品」リンク先ページを開く
      const usedLink = await page.$('a[href*="/gp/offer-listing/"]');
      if (usedLink) {
        const href = await usedLink.evaluate(el => el.getAttribute('href'));
        if (href) {
          const usedUrl = href.startsWith('http') ? href : `https://www.amazon.co.jp${href}`;
          await page.goto(usedUrl, { waitUntil: 'domcontentloaded' });
          // 最安中古価格を取得
          const priceNode = await page.$('.olpOfferPrice, .a-price .a-offscreen');
          if (priceNode) {
            const priceText = await priceNode.evaluate(el => el.textContent ? el.textContent.trim() : '');
            if (priceText) {
              const match = priceText.match(/(¥|￥)?([\d,]+)/);
              if (match) {
                currency = match[1] || '¥';
                value = parseInt(match[2].replace(/,/g, ''), 10);
              }
            }
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }
  await browser.close();
  return { value, currency };
}

/**
 * Amazon.co.jpとKeepaのWebページをスクレイピングして商品情報を取得
 * @param {string} asin
 * @returns {Promise<{ asin: string, title: string, images: string[], newPrice: string, usedPrice: string, salesRank: string, keepaChart: string }>} 
 */
export async function fetchProductDetails(asin: string): Promise<{ asin: string, title: string, images: string[], newPrice: string, usedPrice: string, salesRank: string, keepaChart: string }> {
  const amazonUrl = `https://www.amazon.co.jp/dp/${asin}`;
  const keepaUrl = `https://keepa.com/#!product/5-${asin}`;
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/114.0.0.0 Safari/537.36'
  );
  await page.goto(amazonUrl, { waitUntil: 'domcontentloaded' });

  // 商品名
  let title = '';
  try {
    title = await page.$eval('#productTitle', el => el.textContent ? el.textContent.trim() : '');
  } catch {}

  // 画像URL配列
  let images: string[] = [];
  try {
    images = await page.$$eval('#altImages img', imgs => imgs.map(img => img.src.replace(/_SS40_/, '_SL1000_')));
    if (images.length === 0) {
      const mainImg = await page.$eval('#imgTagWrapperId img', img => img.src);
      images = [mainImg];
    }
  } catch {}

  // 新品価格
  let newPrice = '';
  try {
    newPrice = await page.$eval('.a-price .a-offscreen', el => el.textContent ? el.textContent.trim() : '');
  } catch {}

  // 中古価格
  let usedPrice = '';
  try {
    // 「中古品」リンクを探す
    const usedLink = await page.$('a[href*="/gp/offer-listing/"]');
    if (usedLink) {
      const href = await usedLink.evaluate(el => el.getAttribute('href'));
      if (href) {
        const usedUrl = href.startsWith('http') ? href : `https://www.amazon.co.jp${href}`;
        await page.goto(usedUrl, { waitUntil: 'domcontentloaded' });
        // 最安中古価格を取得
        usedPrice = await page.$eval('.olpOfferPrice, .a-price .a-offscreen', el => el.textContent ? el.textContent.replace(/[^\d]/g, '') : null);
      }
    }
  } catch {}

  // ランキング
  let salesRank = '';
  try {
    salesRank = await page.$eval('#SalesRank', el => el.textContent ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  } catch {}

  // Keepaグラフ画像
  let keepaChart = '';
  try {
    const keepaPage = await browser.newPage();
    await keepaPage.goto(keepaUrl, { waitUntil: 'networkidle2' });
    // Keepaのグラフ画像はcanvas要素またはimg要素で表示される場合がある
    // まずimg[src*='graph']を探す
    const chartImg = await keepaPage.$('img[src*="graph"]');
    if (chartImg) {
      const src = await chartImg.evaluate(img => img.getAttribute('src'));
      if (src && src.startsWith('data:image/png;base64,')) {
        keepaChart = src;
      }
    } else {
      // canvasの場合はスクリーンショットで取得
      const chartCanvas = await keepaPage.$('canvas');
      if (chartCanvas) {
        keepaChart = await chartCanvas.screenshot({ encoding: 'base64' });
        keepaChart = `data:image/png;base64,${keepaChart}`;
      }
    }
    await keepaPage.close();
  } catch {}

  await browser.close();
  return { asin, title, images, newPrice, usedPrice, salesRank, keepaChart };
}

export async function fetchBasicProductData(asin: string): Promise<{ asin: string, title: string, image: string, newPrice: string|null, usedPrice: string|null }> {
  const url = `https://www.amazon.co.jp/dp/${asin}`;
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // 商品名
  let title = '';
  try {
    title = await page.$eval('#productTitle', el => el.textContent ? el.textContent.trim() : '');
  } catch {}

  // 商品画像
  let image = '';
  try {
    image = await page.$eval('#imgTagWrapperId img', img => img.getAttribute('src'));
  } catch {}

  // 新品価格
  let newPrice: string|null = null;
  try {
    newPrice = await page.$eval('.a-price .a-offscreen', el => el.textContent ? el.textContent.replace(/[^\d]/g, '') : null);
  } catch {}

  // 中古最安値
  let usedPrice: string|null = null;
  try {
    // 「中古品」リンクを探す
    const usedLink = await page.$('a[href*="/gp/offer-listing/"]');
    if (usedLink) {
      const href = await usedLink.evaluate(el => el.getAttribute('href'));
      if (href) {
        const usedUrl = href.startsWith('http') ? href : `https://www.amazon.co.jp${href}`;
        await page.goto(usedUrl, { waitUntil: 'domcontentloaded' });
        // 最安中古価格を取得
        usedPrice = await page.$eval('.olpOfferPrice, .a-price .a-offscreen', el => el.textContent ? el.textContent.replace(/[^\d]/g, '') : null);
      }
    }
  } catch {}

  await browser.close();
  return { asin, title, image, newPrice, usedPrice };
} 