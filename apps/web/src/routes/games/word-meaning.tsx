/**
 * Kelime Anlami -- Arapca kelime -> Turkce anlam.
 * 2 dakika sayac (zorluk carpanina gore erime hizi degisir).
 * Sik sayisi zorluga gore: Kolay 3, Orta 4, Zor 5, Hafiz 6.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useRef } from "react";
import { submitScore } from "~/lib/score-service";
import { useTranslation } from "~/hooks/useTranslation";
import { useGameTimer } from "~/hooks/useGameTimer";
import { GameScoreBar } from "~/components/GameScoreBar";
import { GameOverCard } from "~/components/GameOverCard";
import { SurahPickerScreen } from "~/components/SurahPickerScreen";
import { GAME_THEMES } from "~/lib/game-themes";
import {
  OPTION_COUNT,
  calcCorrectPoints,
  calcWrongPenalty,
  formatDelta,
  type Difficulty,
} from "~/lib/game-scoring";

const THEME = GAME_THEMES["word-meaning"];
const P = THEME.primary;

export const Route = createFileRoute("/games/word-meaning")({
  component: WordMeaningPage,
});

interface WordPair {
  arabic: string;
  meaning: string;
  wrong: [string, string, string];
}

// ~150 temel Kuran kelimesi
const WORD_PAIRS: WordPair[] = [
  // Esmaul Husna & Allah'in sifatlari
  { arabic: "\u0627\u0644\u0644\u0651\u064E\u0647\u064F",       meaning: "Allah",                        wrong: ["Melek", "Peygamber", "Cennet"] },
  { arabic: "\u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0670\u0646\u0650", meaning: "Rahman (\u00e7ok merhamet eden)",    wrong: ["\u015Eiddetli", "K\u0131zg\u0131n", "G\u00fc\u00e7l\u00fc"] },
  { arabic: "\u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650",   meaning: "Rahim (merhamet edici)",        wrong: ["Bilen", "Duyan", "Yaratan"] },
  { arabic: "\u0627\u0644\u0652\u0645\u064E\u0644\u0650\u0643\u0650",    meaning: "H\u00fck\u00fcmdar / Melik",              wrong: ["Kul", "El\u00e7i", "Yolcu"] },
  { arabic: "\u0627\u0644\u0652\u0642\u064F\u062F\u0651\u064F\u0648\u0633\u064F",  meaning: "Kutsal / M\u00fcnezzeh",             wrong: ["Adil", "G\u00fc\u00e7l\u00fc", "Yaratan"] },
  { arabic: "\u0627\u0644\u0633\u0651\u064E\u0644\u064E\u0627\u0645\u064F",   meaning: "Esenlik / Selamet",             wrong: ["Sava\u015f", "Azap", "Fitne"] },
  { arabic: "\u0627\u0644\u0652\u0639\u064E\u0632\u0650\u064A\u0632\u064F",   meaning: "G\u00fc\u00e7l\u00fc / Aziz",                 wrong: ["Zay\u0131f", "Yoksul", "Kibar"] },
  { arabic: "\u0627\u0644\u0652\u062D\u064E\u0643\u0650\u064A\u0645\u064F",   meaning: "Hakim / Hikmet sahibi",         wrong: ["Cahil", "Acemi", "Zalim"] },
  { arabic: "\u0627\u0644\u0652\u063A\u064E\u0641\u064F\u0648\u0631\u064F",   meaning: "\u00c7ok ba\u011f\u0131\u015flayan",               wrong: ["Cezaland\u0131ran", "Unutan", "S\u0131nayan"] },
  { arabic: "\u0627\u0644\u0634\u0651\u064E\u0643\u064F\u0648\u0631\u064F",   meaning: "\u015e\u00fckr\u00fc kabul eden",             wrong: ["Nank\u00f6r", "Veren", "Alan"] },
  { arabic: "\u0627\u0644\u0652\u062D\u064E\u0644\u0650\u064A\u0645\u064F",   meaning: "Yumu\u015fak huylu / Halim",        wrong: ["Sert", "K\u0131zg\u0131n", "H\u0131zl\u0131"] },
  { arabic: "\u0627\u0644\u0652\u0639\u064E\u0644\u0650\u064A\u0645\u064F",   meaning: "Her \u015feyi bilen",               wrong: ["G\u00f6ren", "Duyan", "G\u00fc\u00e7l\u00fc"] },
  { arabic: "\u0627\u0644\u0652\u0642\u064E\u062F\u0650\u064A\u0631\u064F",   meaning: "Her \u015feye g\u00fcc\u00fc yeten",          wrong: ["Bilen", "\u0130\u015fiten", "G\u00f6ren"] },
  { arabic: "\u0627\u0644\u0633\u0651\u064E\u0645\u0650\u064A\u0639\u064F",   meaning: "Her \u015feyi i\u015fiten",              wrong: ["G\u00f6ren", "Bilen", "G\u00fc\u00e7l\u00fc"] },
  { arabic: "\u0627\u0644\u0652\u0628\u064E\u0635\u0650\u064A\u0631\u064F",   meaning: "Her \u015feyi g\u00f6ren",               wrong: ["\u0130\u015fiten", "Bilen", "G\u00fc\u00e7l\u00fc"] },
  { arabic: "\u0627\u0644\u0652\u0648\u064E\u0627\u062D\u0650\u062F\u064F",   meaning: "Bir / Tek",                    wrong: ["\u0130ki", "\u00c7ok", "Sonsuz"] },
  { arabic: "\u0627\u0644\u0635\u0651\u064E\u0645\u064E\u062F\u064F",    meaning: "Herkesin muhta\u00e7 oldu\u011fu",       wrong: ["Yaratan", "Y\u0131k\u0131c\u0131", "G\u00f6nderen"] },
  { arabic: "\u0627\u0644\u0652\u0643\u064E\u0631\u0650\u064A\u0645\u064F",   meaning: "\u00c7ok c\u00f6mert / Kerim",           wrong: ["Cimri", "Zalim", "G\u00fc\u00e7l\u00fc"] },
  { arabic: "\u0627\u0644\u0631\u0651\u064E\u0632\u0651\u064E\u0627\u0642\u064F",  meaning: "R\u0131z\u0131k veren",                  wrong: ["Alan", "Yaratan", "\u00d6ld\u00fcren"] },
  { arabic: "\u0627\u0644\u0652\u0648\u064E\u062F\u064F\u0648\u062F\u064F",   meaning: "Seven / Sevilen",              wrong: ["K\u0131zan", "Unutan", "Cezaland\u0131ran"] },
  // Temel kavramlar
  { arabic: "\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F",    meaning: "Hamd / \u00d6vg\u00fc",                  wrong: ["\u015eik\u00e2yet", "Dua", "\u0130stek"] },
  { arabic: "\u0643\u0650\u062A\u064E\u0627\u0628\u064C",      meaning: "Kitap",                        wrong: ["Ev", "Su", "Ta\u015f"] },
  { arabic: "\u0646\u064F\u0648\u0631\u064C",        meaning: "Nur / I\u015f\u0131k",                   wrong: ["Karanl\u0131k", "Ate\u015f", "Su"] },
  { arabic: "\u0635\u064E\u0644\u064E\u0627\u0629\u064C",      meaning: "Namaz / Dua",                  wrong: ["Oru\u00e7", "Zekat", "Hac"] },
  { arabic: "\u0631\u064E\u062D\u0652\u0645\u064E\u0629\u064C",     meaning: "Rahmet / Merhamet",            wrong: ["Azap", "H\u00fcz\u00fcn", "Felaket"] },
  { arabic: "\u062C\u064E\u0646\u0651\u064E\u0629\u064C",      meaning: "Cennet",                       wrong: ["Cehennem", "D\u00fcnya", "Kabir"] },
  { arabic: "\u0646\u064E\u0627\u0631\u064C",        meaning: "Ate\u015f / Cehennem ate\u015fi",        wrong: ["Su", "Hava", "Toprak"] },
  { arabic: "\u0642\u064E\u0644\u0652\u0628\u064C",       meaning: "Kalp / G\u00f6n\u00fcl",                 wrong: ["El", "G\u00f6z", "Kulak"] },
  { arabic: "\u0639\u0650\u0644\u0652\u0645\u064C",       meaning: "\u0130lim / Bilgi",                    wrong: ["Cehalet", "G\u00fc\u00e7", "Mal"] },
  { arabic: "\u0635\u064E\u0628\u0652\u0631\u064C",       meaning: "Sab\u0131r",                        wrong: ["Acele", "Korku", "H\u0131rs"] },
  { arabic: "\u0625\u0650\u064A\u0645\u064E\u0627\u0646\u064C",     meaning: "\u0130man",                         wrong: ["K\u00fcf\u00fcr", "\u015e\u00fcphe", "Kibir"] },
  { arabic: "\u062A\u064E\u0642\u0652\u0648\u064E\u0649",      meaning: "Takva / Allah'tan korkma",     wrong: ["Cimrilik", "Kibir", "Gaflet"] },
  { arabic: "\u0622\u064A\u064E\u0629\u064C",        meaning: "Ayet / \u0130\u015faret",                wrong: ["Sure", "C\u00fcz", "Hizb"] },
  { arabic: "\u0633\u064F\u0648\u0631\u064E\u0629\u064C",      meaning: "Sure",                         wrong: ["Ayet", "Kelime", "Harf"] },
  { arabic: "\u0642\u064F\u0631\u0652\u0622\u0646\u064C",      meaning: "Kuran",                        wrong: ["Tevrat", "\u0130ncil", "Zebur"] },
  { arabic: "\u0631\u064E\u0628\u0651\u0650",        meaning: "Rab / Efendi",                 wrong: ["Kul", "\u015eeytan", "D\u00fcnya"] },
  // Insanlar & toplum
  { arabic: "\u0646\u064E\u0628\u0650\u064A\u0651\u064C",      meaning: "Nebi / Peygamber",             wrong: ["Melek", "Veli", "\u015eehit"] },
  { arabic: "\u0631\u064E\u0633\u064F\u0648\u0644\u064C",      meaning: "Resul / El\u00e7i",                 wrong: ["Kral", "K\u00e2tip", "\u015eair"] },
  { arabic: "\u0645\u064F\u0624\u0652\u0645\u0650\u0646\u064C",     meaning: "M\u00fcmin / \u0130nanan",               wrong: ["K\u00e2fir", "M\u00fcnaf\u0131k", "Fas\u0131k"] },
  { arabic: "\u0643\u064E\u0627\u0641\u0650\u0631\u064C",      meaning: "K\u00e2fir / \u0130nk\u00e2rc\u0131",              wrong: ["M\u00fcmin", "Fas\u0131k", "Zalim"] },
  { arabic: "\u0645\u064F\u0646\u064E\u0627\u0641\u0650\u0642\u064C",    meaning: "M\u00fcnaf\u0131k / \u0130kiy\u00fczl\u00fc",           wrong: ["M\u00fcmin", "K\u00e2fir", "Zalim"] },
  { arabic: "\u0625\u0650\u0646\u0652\u0633\u064E\u0627\u0646\u064C",    meaning: "\u0130nsan",                        wrong: ["Cin", "Melek", "Hayvan"] },
  { arabic: "\u0645\u064E\u0644\u064E\u0643\u064C",       meaning: "Melek",                        wrong: ["Cin", "\u0130nsan", "\u015eeytan"] },
  { arabic: "\u0634\u064E\u064A\u0652\u0637\u064E\u0627\u0646\u064C",    meaning: "\u015eeytan",                       wrong: ["Melek", "Cin", "\u0130nsan"] },
  { arabic: "\u0639\u064E\u0628\u0652\u062F\u064C",       meaning: "Kul / K\u00f6le",                   wrong: ["Efendi", "Kral", "Peygamber"] },
  { arabic: "\u0642\u064E\u0648\u0652\u0645\u064C",       meaning: "Kavim / Halk",                 wrong: ["Ordu", "Aile", "Yolcu"] },
  { arabic: "\u0623\u064F\u0645\u0651\u064E\u0629\u064C",      meaning: "\u00dcmmet / Topluluk",             wrong: ["Aile", "Ordu", "Devlet"] },
  { arabic: "\u0648\u064E\u0644\u0650\u064A\u0651\u064C",      meaning: "Veli / Dost",                  wrong: ["D\u00fc\u015fman", "Yabanc\u0131", "K\u00f6le"] },
  // Doga & evren
  { arabic: "\u0633\u064E\u0645\u064E\u0627\u0621\u064C",      meaning: "G\u00f6k / Sema",                   wrong: ["Yer", "Deniz", "Da\u011f"] },
  { arabic: "\u0623\u064E\u0631\u0652\u0636\u064C",       meaning: "Yer / Toprak",                 wrong: ["G\u00f6k", "Su", "Hava"] },
  { arabic: "\u0645\u064E\u0627\u0621\u064C",        meaning: "Su",                           wrong: ["Ate\u015f", "Hava", "Toprak"] },
  { arabic: "\u0646\u064E\u0647\u064E\u0627\u0631\u064C",      meaning: "G\u00fcnd\u00fcz",                       wrong: ["Gece", "Sabah", "Ak\u015fam"] },
  { arabic: "\u0644\u064E\u064A\u0652\u0644\u064C",       meaning: "Gece",                         wrong: ["G\u00fcnd\u00fcz", "Sabah", "\u00d6\u011fle"] },
  { arabic: "\u0634\u064E\u0645\u0652\u0633\u064C",       meaning: "G\u00fcne\u015f",                        wrong: ["Ay", "Y\u0131ld\u0131z", "Bulut"] },
  { arabic: "\u0642\u064E\u0645\u064E\u0631\u064C",       meaning: "Ay",                           wrong: ["G\u00fcne\u015f", "Y\u0131ld\u0131z", "Bulut"] },
  { arabic: "\u0646\u064E\u062C\u0652\u0645\u064C",       meaning: "Y\u0131ld\u0131z",                       wrong: ["Ay", "G\u00fcne\u015f", "I\u015f\u0131k"] },
  { arabic: "\u062C\u064E\u0628\u064E\u0644\u064C",       meaning: "Da\u011f",                          wrong: ["Deniz", "Nehir", "\u00c7\u00f6l"] },
  { arabic: "\u0628\u064E\u062D\u0652\u0631\u064C",       meaning: "Deniz",                        wrong: ["Nehir", "G\u00f6l", "Da\u011f"] },
  { arabic: "\u0631\u0650\u064A\u062D\u064C",        meaning: "R\u00fczgar",                       wrong: ["Ya\u011fmur", "Kar", "F\u0131rt\u0131na"] },
  { arabic: "\u0645\u064E\u0637\u064E\u0631\u064C",       meaning: "Ya\u011fmur",                       wrong: ["Kar", "R\u00fczgar", "Bulut"] },
  { arabic: "\u0634\u064E\u062C\u064E\u0631\u064E\u0629\u064C",     meaning: "A\u011fa\u00e7",                         wrong: ["\u00c7i\u00e7ek", "Ta\u015f", "Toprak"] },
  // Ahiret & din
  { arabic: "\u064A\u064E\u0648\u0652\u0645\u064C",       meaning: "G\u00fcn",                          wrong: ["Gece", "Y\u0131l", "Ay"] },
  { arabic: "\u0622\u062E\u0650\u0631\u064E\u0629\u064C",      meaning: "Ahiret",                       wrong: ["D\u00fcnya", "Cennet", "Kabir"] },
  { arabic: "\u062F\u064F\u0646\u0652\u064A\u064E\u0627",      meaning: "D\u00fcnya",                        wrong: ["Ahiret", "Cennet", "Cehennem"] },
  { arabic: "\u0642\u0650\u064A\u064E\u0627\u0645\u064E\u0629\u064C",    meaning: "K\u0131yamet",                      wrong: ["\u00d6l\u00fcm", "Hesap", "Cennet"] },
  { arabic: "\u062D\u0650\u0633\u064E\u0627\u0628\u064C",      meaning: "Hesap / Yarg\u0131lama",            wrong: ["\u00d6d\u00fcl", "Azap", "Cennet"] },
  { arabic: "\u062C\u064E\u0647\u064E\u0646\u0651\u064E\u0645\u064F",    meaning: "Cehennem",                     wrong: ["Cennet", "D\u00fcnya", "Kabir"] },
  { arabic: "\u0645\u064E\u0648\u0652\u062A\u064C",       meaning: "\u00d6l\u00fcm",                         wrong: ["Hayat", "Dirili\u015f", "Uyku"] },
  { arabic: "\u062D\u064E\u064A\u064E\u0627\u0629\u064C",      meaning: "Hayat / Ya\u015fam",                wrong: ["\u00d6l\u00fcm", "Uyku", "R\u00fcya"] },
  { arabic: "\u0635\u0650\u0631\u064E\u0627\u0637\u064C",      meaning: "Yol / S\u0131rat",                  wrong: ["Kap\u0131", "K\u00f6pr\u00fc", "Da\u011f"] },
  { arabic: "\u0645\u0650\u064A\u0632\u064E\u0627\u0646\u064C",     meaning: "Terazi / \u00d6l\u00e7\u00fc",                wrong: ["Hesap", "Kitap", "Kalem"] },
  { arabic: "\u0639\u064E\u0630\u064E\u0627\u0628\u064C",      meaning: "Azap / Ceza",                  wrong: ["Nimet", "Rahmet", "Cennet"] },
  { arabic: "\u062B\u064E\u0648\u064E\u0627\u0628\u064C",      meaning: "Sevap / \u00d6d\u00fcl",                wrong: ["Ceza", "Azap", "G\u00fcnah"] },
  { arabic: "\u0630\u064E\u0646\u0652\u0628\u064C",       meaning: "G\u00fcnah / Su\u00e7",                  wrong: ["Sevap", "\u0130badet", "T\u00f6vbe"] },
  { arabic: "\u062A\u064E\u0648\u0652\u0628\u064E\u0629\u064C",     meaning: "T\u00f6vbe / Pi\u015fmanl\u0131k",            wrong: ["G\u00fcnah", "Kibir", "Gaflet"] },
  { arabic: "\u0646\u0650\u0639\u0652\u0645\u064E\u0629\u064C",     meaning: "Nimet",                        wrong: ["Azap", "Ceza", "Yoksulluk"] },
  // Ibadet & ahlak
  { arabic: "\u0632\u064E\u0643\u064E\u0627\u0629\u064C",      meaning: "Zekat",                        wrong: ["Oru\u00e7", "Hac", "Namaz"] },
  { arabic: "\u0635\u064E\u0648\u0652\u0645\u064C",       meaning: "Oru\u00e7",                         wrong: ["Namaz", "Zekat", "Hac"] },
  { arabic: "\u062D\u064E\u062C\u0651\u064C",        meaning: "Hac",                          wrong: ["Umre", "Zekat", "Oru\u00e7"] },
  { arabic: "\u062C\u0650\u0647\u064E\u0627\u062F\u064C",      meaning: "Cihad / M\u00fccadele",             wrong: ["Namaz", "Oru\u00e7", "Hac"] },
  { arabic: "\u062F\u064F\u0639\u064E\u0627\u0621\u064C",      meaning: "Dua",                          wrong: ["Namaz", "Zikir", "Til\u00e2vet"] },
  { arabic: "\u0630\u0650\u0643\u0652\u0631\u064C",       meaning: "Zikir / Anmak",                wrong: ["Dua", "Namaz", "Oru\u00e7"] },
  { arabic: "\u062A\u064E\u0648\u064E\u0643\u0651\u064F\u0644\u064C",    meaning: "Tevekk\u00fcl / Allah'a g\u00fcvenmek",  wrong: ["Korku", "\u00dcmit", "Sab\u0131r"] },
  { arabic: "\u0625\u0650\u062E\u0652\u0644\u064E\u0627\u0635\u064C",    meaning: "\u0130hl\u00e2s / Samimilik",            wrong: ["Riya", "Kibir", "Cimrilik"] },
  { arabic: "\u0634\u064F\u0643\u0652\u0631\u064C",       meaning: "\u015e\u00fck\u00fcr / Te\u015fekk\u00fcr",             wrong: ["Nank\u00f6rl\u00fck", "\u015eikayet", "Kibir"] },
  { arabic: "\u0639\u064E\u062F\u0652\u0644\u064C",       meaning: "Adalet",                       wrong: ["Zul\u00fcm", "Kibir", "Yalan"] },
  { arabic: "\u0623\u064E\u0645\u064E\u0627\u0646\u064E\u0629\u064C",    meaning: "Emanet / G\u00fcven",               wrong: ["H\u0131yanet", "Yalan", "Kibir"] },
  { arabic: "\u0631\u0650\u0628\u064E\u0627",        meaning: "Faiz",                         wrong: ["Zekat", "Sadaka", "Ticaraet"] },
  { arabic: "\u0635\u064E\u062F\u064E\u0642\u064E\u0629\u064C",     meaning: "Sadaka",                       wrong: ["Zekat", "Hac", "Oru\u00e7"] },
  { arabic: "\u0643\u0650\u0628\u0652\u0631\u064C",       meaning: "Kibir / B\u00fcy\u00fckl\u00fck taslama",     wrong: ["Tevazu", "Sab\u0131r", "\u015e\u00fck\u00fcr"] },
  { arabic: "\u062D\u064E\u0633\u064E\u062F\u064C",       meaning: "Haset / K\u0131skan\u00e7l\u0131k",           wrong: ["Sevgi", "Merhamet", "Sab\u0131r"] },
  // Fiiller & eylem isimleri
  { arabic: "\u0647\u064F\u062F\u064B\u0649",        meaning: "Hidayet / Rehberlik",          wrong: ["Sap\u0131kl\u0131k", "Karanl\u0131k", "\u015e\u00fcphe"] },
  { arabic: "\u0636\u064E\u0644\u064E\u0627\u0644\u064C",      meaning: "Sap\u0131kl\u0131k / Yoldan \u00e7\u0131kma",      wrong: ["Hidayet", "\u0130man", "T\u00f6vbe"] },
  { arabic: "\u0641\u064E\u062A\u0652\u062D\u064C",       meaning: "Fetih / A\u00e7\u0131l\u0131\u015f",               wrong: ["Yenilgi", "Kapanma", "H\u00fcz\u00fcn"] },
  { arabic: "\u0646\u064E\u0635\u0652\u0631\u064C",       meaning: "Zafer / Yard\u0131m",               wrong: ["Yenilgi", "H\u00fcz\u00fcn", "Azap"] },
  { arabic: "\u0647\u0650\u062C\u0652\u0631\u064E\u0629\u064C",     meaning: "Hicret / G\u00f6\u00e7",                wrong: ["D\u00f6n\u00fc\u015f", "Sava\u015f", "Bar\u0131\u015f"] },
  { arabic: "\u0639\u064E\u0647\u0652\u062F\u064C",       meaning: "Ahit / S\u00f6zle\u015fme",              wrong: ["Yalan", "H\u0131yanet", "Sava\u015f"] },
  { arabic: "\u0642\u064E\u0648\u0652\u0644\u064C",       meaning: "S\u00f6z / Kelam",                  wrong: ["Sessizlik", "\u0130\u015f", "Bak\u0131\u015f"] },
  { arabic: "\u0641\u0650\u0639\u0652\u0644\u064C",       meaning: "Fiil / Eylem",                 wrong: ["S\u00f6z", "D\u00fc\u015f\u00fcnce", "Niyet"] },
  { arabic: "\u0646\u0650\u064A\u0651\u064E\u0629\u064C",      meaning: "Niyet",                        wrong: ["Eylem", "S\u00f6z", "Sonu\u00e7"] },
  { arabic: "\u062D\u0650\u0643\u0652\u0645\u064E\u0629\u064C",     meaning: "Hikmet / Bilgelik",            wrong: ["Cehalet", "Kibir", "Gaflet"] },
  // Varlik & yaratilis
  { arabic: "\u062E\u064E\u0644\u0652\u0642\u064C",       meaning: "Yarat\u0131l\u0131\u015f / Yarat\u0131k",          wrong: ["\u00d6l\u00fcm", "Y\u0131k\u0131m", "De\u011fi\u015fim"] },
  { arabic: "\u0631\u064F\u0648\u062D\u064C",        meaning: "Ruh",                          wrong: ["Beden", "Kan", "Nefes"] },
  { arabic: "\u0646\u064E\u0641\u0652\u0633\u064C",       meaning: "Nefs / Can",                   wrong: ["Ruh", "Beden", "Ak\u0131l"] },
  { arabic: "\u0639\u064E\u0642\u0652\u0644\u064C",       meaning: "Ak\u0131l",                         wrong: ["Kalp", "Nefs", "Ruh"] },
  { arabic: "\u0644\u0650\u0633\u064E\u0627\u0646\u064C",      meaning: "Dil / Lisan",                  wrong: ["G\u00f6z", "Kulak", "El"] },
  { arabic: "\u064A\u064E\u062F\u064C",         meaning: "El",                           wrong: ["G\u00f6z", "Ayak", "Ba\u015f"] },
  { arabic: "\u0639\u064E\u064A\u0652\u0646\u064C",       meaning: "G\u00f6z / P\u0131nar",                  wrong: ["Kulak", "El", "Dil"] },
  { arabic: "\u0623\u064F\u0630\u064F\u0646\u064C",       meaning: "Kulak",                        wrong: ["G\u00f6z", "Dil", "El"] },
  { arabic: "\u0648\u064E\u062C\u0652\u0647\u064C",       meaning: "Y\u00fcz",                          wrong: ["El", "Ayak", "G\u00f6n\u00fcl"] },
  // Zaman & mekan
  { arabic: "\u0648\u064E\u0642\u0652\u062A\u064C",       meaning: "Vakit / Zaman",                wrong: ["Mekan", "Yol", "Kap\u0131"] },
  { arabic: "\u0645\u064E\u0633\u0652\u062C\u0650\u062F\u064C",     meaning: "Mescit / Cami",                wrong: ["Ev", "Pazar", "Saray"] },
  { arabic: "\u0628\u064E\u064A\u0652\u062A\u064C",       meaning: "Ev",                           wrong: ["Mescit", "Kap\u0131", "Yol"] },
  { arabic: "\u0645\u064E\u062F\u0650\u064A\u0646\u064E\u0629\u064C",    meaning: "\u015eehir / Medine",               wrong: ["K\u00f6y", "\u00c7\u00f6l", "Da\u011f"] },
  { arabic: "\u0637\u064E\u0631\u0650\u064A\u0642\u064C",      meaning: "Yol",                          wrong: ["Kap\u0131", "Ev", "Nehir"] },
  { arabic: "\u0623\u064E\u0648\u0651\u064E\u0644\u064C",      meaning: "\u0130lk / Evvel",                  wrong: ["Son", "Orta", "Bir"] },
  { arabic: "\u0622\u062E\u0650\u0631\u064C",        meaning: "Son / Ahir",                   wrong: ["\u0130lk", "Orta", "Yeni"] },
  // Sifatlar & nitelikler
  { arabic: "\u0643\u064E\u0628\u0650\u064A\u0631\u064C",      meaning: "B\u00fcy\u00fck",                        wrong: ["K\u00fc\u00e7\u00fck", "Uzak", "Eski"] },
  { arabic: "\u0635\u064E\u063A\u0650\u064A\u0631\u064C",      meaning: "K\u00fc\u00e7\u00fck",                        wrong: ["B\u00fcy\u00fck", "Uzun", "Yeni"] },
  { arabic: "\u0639\u064E\u0638\u0650\u064A\u0645\u064C",      meaning: "Y\u00fcce / Azim",                  wrong: ["K\u00fc\u00e7\u00fck", "Zay\u0131f", "Adi"] },
  { arabic: "\u062D\u064E\u0642\u0651\u064C",        meaning: "Hak / Ger\u00e7ek",                 wrong: ["Bat\u0131l", "Yalan", "\u015e\u00fcphe"] },
  { arabic: "\u0628\u064E\u0627\u0637\u0650\u0644\u064C",      meaning: "Bat\u0131l / Ge\u00e7ersiz",             wrong: ["Hak", "Ger\u00e7ek", "Do\u011fru"] },
  { arabic: "\u062D\u064E\u0633\u064E\u0646\u064C",       meaning: "G\u00fczel / \u0130yi",                  wrong: ["K\u00f6t\u00fc", "\u00c7irkin", "Yanl\u0131\u015f"] },
  { arabic: "\u0642\u064E\u0631\u0650\u064A\u0628\u064C",      meaning: "Yak\u0131n",                        wrong: ["Uzak", "Yabanc\u0131", "Gizli"] },
  { arabic: "\u0628\u064E\u0639\u0650\u064A\u062F\u064C",      meaning: "Uzak",                         wrong: ["Yak\u0131n", "Burada", "Gizli"] },
  // Diger onemli kelimeler
  { arabic: "\u0623\u064E\u0645\u0652\u0631\u064C",       meaning: "Emir / \u0130\u015f",                    wrong: ["Yasak", "Niyet", "S\u00f6z"] },
  { arabic: "\u0646\u064E\u0647\u0652\u064A\u064C",       meaning: "Yasak / Nehiy",                wrong: ["Emir", "\u0130zin", "Te\u015fvik"] },
  { arabic: "\u0645\u064E\u0644\u064E\u0643\u064F\u0648\u062A\u064C",    meaning: "H\u00fck\u00fcmranl\u0131k / \u0130ktidar",        wrong: ["Zay\u0131fl\u0131k", "Yoksulluk", "K\u00f6lelik"] },
  { arabic: "\u063A\u064E\u064A\u0652\u0628\u064C",       meaning: "Gayb / G\u00f6r\u00fcnmez",              wrong: ["G\u00f6r\u00fcnen", "Bilinen", "A\u00e7\u0131k"] },
  { arabic: "\u0648\u064E\u062D\u0652\u064A\u064C",       meaning: "Vahiy",                        wrong: ["R\u00fcya", "G\u00f6r\u00fc\u015f", "D\u00fc\u015f\u00fcnce"] },
  { arabic: "\u0641\u0650\u0631\u0652\u0639\u064E\u0648\u0652\u0646\u064F",   meaning: "Firavun",                      wrong: ["Karun", "Haman", "Nemrut"] },
  { arabic: "\u0625\u0650\u0628\u0652\u0631\u064E\u0627\u0647\u0650\u064A\u0645\u064F", meaning: "\u0130brahim (a.s.)",               wrong: ["Musa", "\u0130sa", "Yusuf"] },
  { arabic: "\u0645\u064F\u0648\u0633\u064E\u0649",       meaning: "Musa (a.s.)",                  wrong: ["\u0130sa", "\u0130brahim", "Davud"] },
  { arabic: "\u0639\u0650\u064A\u0633\u064E\u0649",       meaning: "\u0130sa (a.s.)",                   wrong: ["Musa", "\u0130brahim", "Yahya"] },
  { arabic: "\u0645\u064F\u062D\u064E\u0645\u0651\u064E\u062F\u064C",    meaning: "Muhammed (s.a.v.)",             wrong: ["\u0130brahim", "Musa", "\u0130sa"] },
  { arabic: "\u0625\u0650\u0633\u0652\u0631\u064E\u0627\u0626\u0650\u064A\u0644\u064F", meaning: "\u0130srail / Yakup (a.s.)",        wrong: ["\u0130brahim", "Musa", "\u0130smail"] },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getRandomQuestion(usedIndices: Set<number>, optionCount = 4) {
  const available = WORD_PAIRS.map((_, i) => i).filter((i) => !usedIndices.has(i));
  const pool = available.length > 0 ? available : Array.from({ length: WORD_PAIRS.length }, (_, i) => i);
  const idx = pool[Math.floor(Math.random() * pool.length)];
  const pair = WORD_PAIRS[idx];
  // Base 3 wrong answers + extra distractors from other pairs for harder difficulties
  const wrongs = [...pair.wrong];
  if (optionCount > 4) {
    const extras = WORD_PAIRS
      .filter((_, i) => i !== idx)
      .map((p) => p.meaning)
      .filter((m) => m !== pair.meaning && !wrongs.includes(m));
    const shuffledExtras = shuffle(extras);
    wrongs.push(...shuffledExtras.slice(0, optionCount - 4));
  }
  const options = shuffle([pair.meaning, ...wrongs.slice(0, optionCount - 1)]);
  return { ...pair, options, idx };
}

type GameState = "playing" | "correct" | "wrong";

function WordMeaningPage() {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<"setup" | "game" | "gameover">("setup");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const timer = useGameTimer(difficulty);
  const optionCount = OPTION_COUNT[difficulty];

  // Game state
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [lastDelta, setLastDelta] = useState<number | null>(null);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [question, setQuestion] = useState(() => getRandomQuestion(new Set(), optionCount));
  const [gameState, setGameState] = useState<GameState>("playing");
  const [selected, setSelected] = useState<string | null>(null);
  const submittedRef = useRef(false);
  const sessionStart = useRef(Date.now());
  const questionStart = useRef(Date.now());
  const timerStartedRef = useRef(false);

  // Start timer when game screen is shown
  useEffect(() => {
    if (screen === "game" && !timerStartedRef.current && !timer.isExpired) {
      timer.start();
      timerStartedRef.current = true;
    }
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer expired -> end game
  useEffect(() => {
    if (timer.isExpired && screen === "game") {
      endGame();
    }
  }, [timer.isExpired]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (gameState !== "correct") return;
    const t = setTimeout(nextRound, 2000);
    return () => clearTimeout(t);
  }, [gameState]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback(
    (opt: string) => {
      if (gameState !== "playing" || timer.isExpired) return;
      setSelected(opt);
      const answerTime = Date.now() - questionStart.current;

      if (opt === question.meaning) {
        const newStreak = streak + 1;
        const pts = calcCorrectPoints(difficulty, answerTime, newStreak);
        setScore((s) => s + pts);
        setStreak(newStreak);
        setBestStreak((b) => Math.max(b, newStreak));
        setCorrectCount((c) => c + 1);
        setLastDelta(pts);
        setGameState("correct");
        setUsedIndices((prev) => new Set(prev).add(question.idx));
      } else {
        const penalty = calcWrongPenalty(difficulty);
        setScore((s) => Math.max(0, s - penalty));
        setStreak(0);
        setWrongCount((c) => c + 1);
        setLastDelta(-penalty);
        setGameState("wrong");
      }
    },
    [gameState, question, streak, difficulty, timer.isExpired],
  );

  const endGame = useCallback(() => {
    timer.pause();
    if (!submittedRef.current && score > 0) {
      submittedRef.current = true;
      submitScore({ data: { gameId: "word-meaning", score, durationMs: Date.now() - sessionStart.current, difficulty } })
        .then((r) => { if (r?.isNewHighScore) setIsNewHighScore(true); })
        .catch(() => {});
    }
    setScreen("gameover");
  }, [score, difficulty, timer]);

  const nextRound = () => {
    if (timer.isExpired) { endGame(); return; }
    const nextUsed = gameState === "correct" ? new Set([...usedIndices, question.idx]) : usedIndices;
    setQuestion(getRandomQuestion(nextUsed, optionCount));
    setGameState("playing");
    setSelected(null);
    setLastDelta(null);
    setRound((r) => r + 1);
    questionStart.current = Date.now();
  };

  const handleRestart = () => {
    const fresh = new Set<number>();
    setUsedIndices(fresh); setScore(0); setRound(1); setStreak(0);
    setBestStreak(0); setCorrectCount(0); setWrongCount(0);
    setLastDelta(null); setIsNewHighScore(false);
    submittedRef.current = false; sessionStart.current = Date.now();
    questionStart.current = Date.now(); timerStartedRef.current = false;
    setQuestion(getRandomQuestion(fresh, optionCount));
    setGameState("playing"); setSelected(null); setScreen("game");
    timer.reset();
  };

  if (screen === "setup") {
    return (
      <SurahPickerScreen
        gameImg={THEME.img}
        difficultyOnly
        onStart={(_ids, _vf, diff) => {
          setDifficulty(diff ?? "medium");
          handleRestart();
        }}
      />
    );
  }

  if (screen === "gameover") {
    return (
      <GameOverCard
        theme={THEME} score={score} correctCount={correctCount} wrongCount={wrongCount}
        bestStreak={bestStreak} isNewHighScore={isNewHighScore} t={t}
        onRestart={handleRestart} onSetup={() => setScreen("setup")}
      />
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-24 game-bg" style={{ "--game-bg-gradient": `linear-gradient(180deg, ${THEME.bg}, ${THEME.surface})` } as React.CSSProperties}>
      <GameHeader
        img={THEME.img} bg={THEME.bg} isDark={THEME.isDark}
        title={t.wordMeaningGame.title}
        onBack={() => endGame()}
        right={
          <div className="flex items-center gap-2">
            {streak >= 2 && (
              <span className="game-streak-fire" style={{ color: P, backgroundColor: `${P}20`, ["--glow-color" as string]: THEME.glow }}>
                {streak}x
              </span>
            )}
          </div>
        }
      />
      <div className="px-4 pt-2">
        <GameScoreBar
          theme={THEME}
          timerDisplay={timer.display}
          timerProgress={timer.progress}
          score={score}
          streak={streak}
          lastDelta={lastDelta}
          round={round}
        />

        {/* Arabic word card */}
        <div
          className="px-5 py-8 rounded-2xl border bg-[var(--color-surface)] mb-5 text-center game-slide-up"
          style={{ borderColor: `${P}25`, boxShadow: `0 4px 20px ${THEME.glow}` }}
        >
          <p className="text-xs text-[var(--color-text-secondary)] mb-6">{t.wordMeaningGame.questionPrompt}</p>
          <p
            className="text-5xl font-bold text-[var(--color-text-primary)] leading-[1.6] game-bounce-in"
            dir="rtl" lang="ar"
            style={{ fontFamily: "var(--font-arabic)" }}
          >
            {question.arabic}
          </p>
        </div>

        {/* Options - 2x2 grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {question.options.map((opt) => {
            let bgColor = "var(--color-surface)";
            let borderColor = `${P}20`;
            let textColor = "var(--color-text-primary)";
            let extraClass = "";

            if (gameState !== "playing") {
              if (opt === question.meaning) {
                bgColor = `${P}12`;
                borderColor = `${P}60`;
                textColor = P;
                extraClass = "game-bounce-in";
              } else if (opt === selected) {
                bgColor = "#fef2f2";
                borderColor = "#fca5a5";
                textColor = "#dc2626";
                extraClass = "game-shake";
              } else {
                bgColor = "transparent";
                borderColor = `${P}10`;
                extraClass = "opacity-30";
              }
            }

            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                disabled={gameState !== "playing"}
                className={`game-option-card text-center ${extraClass}`}
                style={{ backgroundColor: bgColor, borderColor, color: textColor }}
              >
                <span className="text-sm font-medium">{opt}</span>
              </button>
            );
          })}
        </div>

        {gameState === "correct" && (
          <div
            className="px-4 py-3 rounded-xl text-center border game-slide-up"
            style={{ backgroundColor: `${P}10`, borderColor: `${P}30`, boxShadow: `0 2px 12px ${THEME.glow}` }}
          >
            <p className="text-sm font-semibold flex items-center justify-center gap-2" style={{ color: P }}>
              <span className="game-star-spin">{"\u{2B50}"}</span>
              {t.fillBlankGame.correct} {lastDelta !== null && formatDelta(lastDelta)}
            </p>
          </div>
        )}

        {gameState === "wrong" && (
          <>
            <div className="px-4 py-3 rounded-xl text-center bg-red-50 border border-red-100 mb-3 game-slide-up">
              <p className="text-sm font-semibold text-red-600 flex items-center justify-center gap-2">
                <span>{"\u{1F614}"}</span>
                {t.wordMeaningGame.wrong.replace("{word}", question.meaning)} {lastDelta !== null && formatDelta(lastDelta)}
              </p>
            </div>
            <button
              onClick={nextRound}
              className="w-full py-3 rounded-xl text-white font-bold text-sm active:scale-95 transition-all"
              style={{ background: `linear-gradient(135deg, ${P}, ${THEME.secondary})`, boxShadow: `0 2px 10px ${THEME.glow}` }}
            >
              {t.wordMeaningGame.nextQuestion}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
