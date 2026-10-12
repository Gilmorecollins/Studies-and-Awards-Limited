# Kalenjin: notes for the translator

This is the working guide for whoever writes the Kalenjin for the website. Nothing
here is a finished translation: the site shows no Kalenjin until a fluent speaker has
filled in `kal-to-translate.csv` and the language is switched on (see the end).

## Why a person has to do this

Kalenjin has very little written material online. What exists is too small and too
inconsistent to translate whole sentences from reliably, and getting it wrong on a
site about visas and fees could mislead students. The open resources found:

| Resource | What it is | Why it is not enough |
| --- | --- | --- |
| [Kalenjin–Kiswahili parallel corpus](https://zenodo.org/records/13355021) (Lacuna Fund, USIU-Africa and Kabarak University; Apache-2.0) | About 35,000 sentence pairs collected by a university project | Spelling and dialect vary line by line, and some pairs do not match (a search for "tuma" returns lines about the name Tumaini). Everyday sentences, not business wording |
| [thinkKenya data on Hugging Face](https://huggingface.co/datasets/thinkKenya/kenyan-low-resource-language-data) and models trained on it | The same kind of data, plus translation models | The models only translate Kalenjin **into** Kiswahili, and are trained on that same data |
| [Freelang Kipsigis dictionary](https://www.freelang.net/dictionary/kipsigis.php) (about 1,000 words each way, 2014) | A small word list for Kipsigis | A Windows download that is not openly licensed; a few words only |
| [Lughayangu](https://lughayangu.com/nandi) | Short word lists for Nandi and Kipsigis | Words only, with little meaning given |

Kalenjin is a group of related languages (Nandi, Kipsigis, Keiyo, Tugen and others).
Eldoret has Nandi, Keiyo and other Kalenjin speakers around it. Please translate into
the form your readers use, and keep to it throughout.

## How to fill in the sheet

Open `kal-to-translate.csv` in Excel or Google Sheets. Each row has the English, the
Kiswahili beside it (to check the meaning against both), and an empty `translation`
column.

* Write only the **translation** column. Leave a row empty to keep that line in English.
* `type` tells you what the line is: `text`, `label` (a tooltip or screen-reader label),
  `title` (the browser tab title), or `html`.
* In an **`html`** row the English has tags like `<strong>…</strong>` or
  `<a href="…">…</a>`. Keep the tags and the links exactly as they are and change only
  the words between them.
* Keep names as they are: Studies and Awards, Daima Towers, Eldoret, IELTS, PTE, GTE,
  CoE, Magister Sacco, Reserve Trip Kenya, the staff names, and the codes (EDL, SYD…).
* Use the same word for the same thing every time (see the list below).
* Be careful with anything about **visas, fees, deadlines and documents**: say exactly
  what the English says, and leave a line in English rather than guess.

## Words the corpus uses (a starting point, not a ruling)

Taken from lines where the Kalenjin and Kiswahili clearly match. Spellings vary between
speakers; each one is attested in several lines. **Please confirm or replace every one.**

| English | Seen in the corpus | Note |
| --- | --- | --- |
| school | `sukul`, `sukulit` (also written `sugul`, `sikul`) | borrowed from English |
| student / learner | `lakwet tap sukul` ("child of the school"), `kipsomaniat` | |
| teacher | `kanetindet` (plural `kanetiik`) | |
| education, learning | `somanet` | from `soman-`, to learn or read |
| university | `sukulit nebo barak` | "school of the high place" |
| exam / test | `tiemutik`, `temutik` | borrowed |
| English (language) | `kutit tab chumbek` | "language of the white people" |
| country | `emet` (as in `emet ab Kenya`) | |
| office | `ofisit` | borrowed |
| aeroplane | `tarityet`, `tariet` | |
| journey / trip | `banda`, `panda` | `rutoi` also appears |
| telephone | `simet` | |
| book | `kitabut` | |
| thank you | `kongoi` | |

Three to watch:

* **"Free" (no charge)**: the corpus has `puch` / `buuch`, but in its lines it means
  "for nothing" or "in vain" (like Kiswahili *bure*). For "free consultation" a speaker
  should choose wording that means *no charge*, not *worthless*.
* **Greeting**: `chamgei` is often given as the Kalenjin "hello", but in the corpus the same stem means *love / like* (`kechamgei`, "we love each other"). Do not use it as a greeting here without checking.
* **"Money"**: `robinik` and `chepkondok` both appear, probably different dialects.
  Pick the one your readers use.

## Checking after the sheet is filled

1. Save it as CSV (UTF-8), keeping the same four columns.
2. `node tools/i18n.mjs import kal tools/i18n/kal-to-translate.csv` writes
   `site/js/i18n-kal.js` from it.
3. Preview any page with `?lang=kal` on the end of its address (for example
   `index.html?lang=kal`) and read it with a second Kalenjin speaker if you can.
4. When it reads correctly, set `reviewed: true` on the `kal` line in `site/js/i18n.js`.
   Until then Kalenjin is not offered in the language switch.

Credit: the word list above comes from the corpus linked in the table, which is
published under the Apache-2.0 licence. None of its data is included in the website.
