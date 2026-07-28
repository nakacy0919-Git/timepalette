/**
 * World Explorerの国別詳細データ型
 *
 * JSON自体にはJSDocを記述できないため、
 * このファイルでアプリ全体のデータ構造を定義します。
 */

/**
 * @typedef {Object} CountryCurrency
 * @property {string} code - ISO 4217通貨コード
 * @property {string} nameJa - 日本語の通貨名
 * @property {string} nameEn - 英語の通貨名
 * @property {string} symbol - 通貨記号
 */

/**
 * @typedef {Object} CountryLanguage
 * @property {string} code - 言語コード
 * @property {string} nameJa - 日本語の言語名
 * @property {string} nameEn - 英語の言語名
 */

/**
 * @typedef {Object} CountryWeather
 * @property {string} summary - 子ども向けの気候説明
 * @property {string} summer - 夏の特徴
 * @property {string} winter - 冬の特徴
 * @property {string} bestSeason - 観光や学習に適した時期
 */

/**
 * @typedef {Object} CountryVisualCard
 * @property {string} id - カード固有ID
 * @property {string} title - カードタイトル
 * @property {string} description - 子ども向け解説
 * @property {string} image - 画像URL
 * @property {string=} location - 場所
 * @property {string=} category - 分類
 */

/**
 * @typedef {Object} JapanConnection
 * @property {string} title - 日本との関係を紹介する見出し
 * @property {string} text - 日本との関係を説明する文章
 */

/**
 * @typedef {Object} CountryQuiz
 * @property {string} question - クイズの問題文
 * @property {[string, string, string, string]} options - 4つの選択肢
 * @property {number} correctIndex - 正解番号。0から3
 * @property {string} explanation - 正解後に表示する解説
 */

/**
 * @typedef {Object} CountryDetailData
 * @property {string} iso - ISO 3166-1 alpha-2コード
 * @property {string} nameJa - 日本語の国名
 * @property {string} nameEn - 英語の国名
 * @property {string} capitalJa - 日本語の首都名
 * @property {string} capitalEn - 英語の首都名
 * @property {string} region - 地域名
 * @property {string} subregion - より詳しい地域名
 * @property {string} subtitle - ヒーロー部分の紹介文
 * @property {string} flagUrl - 国旗画像URL
 * @property {string} mapQuery - Google Maps検索用文字列
 * @property {string} timeZone - IANAタイムゾーン
 * @property {CountryCurrency} currency - 通貨
 * @property {CountryLanguage[]} languages - 主な言語
 * @property {string|number} elevation - 首都のおよその標高
 * @property {string=} timeDifferenceFromJapan - 日本との時差説明
 * @property {CountryWeather} weather - 気候情報
 * @property {CountryVisualCard[]} heritage - 世界遺産・観光地
 * @property {CountryVisualCard[]} culture - 食事・文化・伝統
 * @property {JapanConnection} japanConnection - 日本との関係
 * @property {CountryQuiz} quiz - 学習クイズ
 */

/**
 * アルファベット別JSONファイルをViteに認識させます。
 *
 * 例:
 * ./countries_a.json
 * ./countries_f.json
 * ./countries_j.json
 * ./countries_u.json
 *
 * eagerをfalseにすることで、必要になるまで読み込みません。
 */
const COUNTRY_DATA_MODULES = import.meta.glob(
  "./countries_*.json",
  {
    eager: false,
  },
);

/**
 * ISOコードを安全に正規化します。
 *
 * @param {unknown} iso
 * @returns {string}
 */
function normalizeIso(iso) {
  if (typeof iso !== "string") {
    return "";
  }

  return iso.trim().toLowerCase();
}

/**
 * 国データの最低限の構造を確認します。
 *
 * 完全に厳密な検証ではなく、表示に必要な主要項目を確認します。
 *
 * @param {unknown} value
 * @returns {value is CountryDetailData}
 */
export function isCountryDetailData(value) {
  if (!value || typeof value !== "object") {
    return false;
  }

  return Boolean(
    typeof value.iso === "string" &&
      typeof value.nameJa === "string" &&
      typeof value.nameEn === "string" &&
      typeof value.capitalJa === "string" &&
      typeof value.timeZone === "string" &&
      value.currency &&
      Array.isArray(value.languages) &&
      Array.isArray(value.heritage) &&
      Array.isArray(value.culture) &&
      value.japanConnection &&
      value.quiz,
  );
}

/**
 * ISOコードに対応するデータファイル名を返します。
 *
 * @param {string} iso
 * @returns {string|null}
 *
 * @example
 * getCountryDataPath("jp");
 * // "./countries_j.json"
 */
export function getCountryDataPath(iso) {
  const normalizedIso = normalizeIso(iso);

  if (!/^[a-z]{2}$/.test(normalizedIso)) {
    return null;
  }

  const firstLetter = normalizedIso.charAt(0);

  return `./countries_${firstLetter}.json`;
}

/**
 * ISOコードをもとに、国別詳細データを非同期で読み込みます。
 *
 * データはISOコードの最初の文字によって、
 * アルファベット別のJSONファイルから読み込まれます。
 *
 * jp → countries_j.json
 * fr → countries_f.json
 * us → countries_u.json
 *
 * @param {string} iso - ISO 3166-1 alpha-2コード
 * @returns {Promise<CountryDetailData|null>}
 *
 * @example
 * const japan = await loadCountryDetailData("jp");
 *
 * if (japan) {
 *   console.log(japan.nameJa);
 * }
 */
export const loadCountryDetailData = async (iso) => {
  const normalizedIso = normalizeIso(iso);

  if (!/^[a-z]{2}$/.test(normalizedIso)) {
    console.error(
      "Data load error: ISOコードは2文字の英字で指定してください。",
      iso,
    );

    return null;
  }

  try {
    const firstLetter = normalizedIso.charAt(0);
    const modulePath = `./countries_${firstLetter}.json`;

    const moduleLoader = COUNTRY_DATA_MODULES[modulePath];

    if (!moduleLoader) {
      console.error(
        `Data load error: ${modulePath} が見つかりません。`,
      );

      return null;
    }

    const dataModule = await moduleLoader();
    const countryCollection =
      dataModule.default ?? dataModule;

    const country =
      countryCollection[normalizedIso] ?? null;

    if (!country) {
      console.warn(
        `Country data not found: ${normalizedIso}`,
      );

      return null;
    }

    if (!isCountryDetailData(country)) {
      console.warn(
        `Country data schema warning: ${normalizedIso} のデータに不足している項目があります。`,
        country,
      );
    }

    return country;
  } catch (error) {
    console.error("Data load error:", error);
    return null;
  }
};