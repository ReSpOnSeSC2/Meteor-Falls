/**
 * PUERTO SOL — editor-authored third-town map using EarthBound Threed grammar.
 *
 * Generated from tools/mapeditor/author-puerto-threed.ts into the visual editor
 * document tools/mapeditor/puerto_sol.json. Fold durable structural edits back
 * into that authoring source so runtime and editor artifacts remain aligned.
 * Dynamic named-interior and reciprocal landing wiring stays in maps_ch2.ts.
 */
import type { MapDef } from '../schemas';

export const puertoSolMap: MapDef = {
  "id": "puerto_sol",
  "name": "PUERTO SOL",
  "music": "puerto",
  "night": true,
  "ambience": "waves",
  "settlement": "city",
  "grid": [
    "bbbbbRRDRRbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "bbbbbRRDRbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "bbbbbRRRRbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "bbbbbRRRRbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "bbb.bRRDRbb..b.......bb.bbbb.b.bb.b....bbbbbbbfbbbb.bbbbbbb..bb.b..bbb.bb..b..bbbbbbb.bb.b..b...bbbb",
    "bbbbbRRDR=............b...bb...bb.b.......bbb..b....bb.bb.b..b..b..bb.,.f.....b.b.b...bb.......bbbbb",
    "bbbbbRRRR=.......F...............................................................qqqqqqqqqq....bbbbb",
    "bbb.=RRRR=.......................................................................qqqqqqqqqqq....bbbb",
    "bbb.=RRDR=.....................f.....f.................~........................qqqzqqqqqqqq.....bbb",
    "bbbb=RRDR=..................,.................F.......... ..............,.......qqqqqqqqqqqq...bbbbb",
    "bbb~=RRRR=|-----------------|...................................................qqqqqqqqqqqq.....bbb",
    "bbbbbRRRR=|....f............|...................................................qqqqqqqqqqqq...bbbbb",
    "bbbbbRRDR=|.::::::::::::::..|............................~f.....................qqqqqqqqzqq......bbb",
    "bbbb=RRD2=|.:::::::::::::::.|.F.................~................................qqqqqqqqqq.....bbbb",
    "bbbb=RRRR=|..:::.........:::|...........F...f....................f......~...............::... .bbbbb",
    "bbbbbRRRR=| ..:::.~.......::|.==========================1====================================1===bbb",
    "bbbb=RRDR=|....:::..f.....::|.XXRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRXXRRRRRRRRRRRRRRRRRRRRRRRRRRRRRbbb",
    "bbb.=RRDR=|..~..::::......::|.XXRRRRRRRRRRRRRRRRRRRRRRRRR2RRRRRRRRXXRRRRRRRRRR2RRRRRRRRRRRRRRRRRRbbb",
    "bbbb=RRRR=|.....::::......::|.___RRR___RRR___RRR___RRR___RRR___RRR4__RRR___RRR___RRR___RRR___R4R_bbb",
    "bbbbbRRRR=|.....::::......::|.RRRRRRRRRRRR2RR2RRRRRRRRRRRRRRRRRRRRRRR2RRRRRRRRRRRRRRRRRRRRRRRRRRRbbb",
    "bbb.=RRDR=|.....::::......::|.================================RRRRDR======================RRRRDR=bbb",
    "bbbbbRRDR=|.....::::......::|.......:::......................=RRRDR=.....................=RRRDR=.bbb",
    "bbbb=RRRR=|.....::::......::|.f.....::...F..................=RRRRR1..f...........f......=RR2RR=.bbbb",
    "bbbb=RRRR=|.....::::......::|.......::.....................=RRRRR=... .................=RRRRR=...bbb",
    "bbb.=RRDR=|.....::::......::|......:::....................=RRRDR=............~........=RRRDR=..bbbbb",
    "bbbbbRRDR=|.....::::......::|......:: ...................=RRRDR=f...........f........=RRRDR=.....bbb",
    "bbbb=RRRR=|......:::......::|......::.....~.............=RRRRR=.....................=RRRRR=..... bbb",
    "bbbbbRRRR=|....F.,:::.....::|...F..::..................=RRRRR=......f...........F..=RRRRR=..,..bbbbb",
    "bbbbbRRDR=|.......::::......|......::.................=RRRDR=.....................=RRRDR=........bbb",
    "bbb.=RRDR=|.......::::......|.....,::.............,..=RRRDR=.~..f................=RRRDR=......~bbbbb",
    "bbbbbRRRR=|...F.,.:::.......|......::...~...f.......=RRRRR1......f......F.......=RRRRR=........bbbbb",
    "bbbbbRRRR=--------::---------......::..............=RRRRR=..f..................=RRRRR=.........bbbbb",
    "bbbb=RRDR=........:::..............::.............=RRRDR=.......~.............=RRRDR=...........bbbb",
    "bbb.=RRDR=.f......::.............................=RRRDR=.....................=RRRDR=......~....f.bbb",
    "bbb.=RRRR=... ....::........................==pppppppppp==...................=R2RR=..............bbb",
    "bbbbbRRRR=.....F.~:::............f..........==pppppppppp==.f..~..........................f.....bbbbb",
    "bbb.=RRDR=..,......:::........f........,....==pppppppppp==...........f....................f....bbbbb",
    "bbbb=RRDR=......f...:::.....................==pppppppppp==.......,.....~.......................bbbbb",
    "bbb.=RRRR=...........:::...........,........==pppppppppp==..............................,......bbbbb",
    "bbbbbRRRR=..........~.::::::.........F.....===pppppppppp==....................F...~............bbbbb",
    "bbbb=RRDR=.............:::::..............=R==pppppppppp==..,.......................f...........~bbb",
    "bbbbbRRDR=......f..................,.... 1RR==pppppppppp==............................,.~.......bbbb",
    "bbb.=RRRR=..............................=RRR==pppppppppp==......,..,........,..f...........~.....bbb",
    "bbb.=RRRR=........................F....=RRRRR=..............................,...................bbbb",
    "bbbbbRRDR=..F.....~...........,.......=RRRDR=........f.............................f...........bbbbb",
    "bbbb=RRDR=...........f..........f....=RRRDR=............,.......................................bbbb",
    "bbbbb2RRR=......,...................=RRRRR=......................f....................,~.........bbb",
    "bbb.=RRRR=.........f...............=RRRRR=..................................~..................bbbbb",
    "bbbbbRRDR=.............F..........=RRRDR=..............................f..................... ...bbb",
    "bbbbbRRDR=.F............. .......=RRRDR=.......................................................bbbbb",
    "bbb.=RXXR=... ..................=RRRRR=................ .............................f...........bbb",
    "bb===RXXR=======================RRXXRR==========================================================bbbb",
    "bbRRRRRDRRRRRRRRRRRRRRRRRRRRRRRRRRXXRRRRRRRRRRRRRRRRRRRR2RRRRRXXRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR",
    "bbRR2RRRRRRRRRRRRRRRRRRRRRRRRRRRRR4RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR2RRRRRRRRRRRRR",
    "bb_RRR_4_RRR___RRR___RRR___RRR___RRR___RRR___RRR___RRR___RRR___RRR___RRR___RRR___RRR___RRR___RRR___R",
    "bbRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR2RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR2RRRRRRRRRRRRRRRRRRR",
    "bb=========================1=======1=========================================1==================bbbb",
    "bbbbb..............f,............................~................................,........f.....bbb",
    "bbbb..~..f.............. ........................................................~........~....f.bbb",
    "bbb.........................................,............~f...........................f......f.bbbbb",
    "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
    "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
    "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
    "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
    "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
    "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
    "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
    "EeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeE",
    "EeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeE",
    "EeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeE",
    "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
    "5555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555"
  ],
  "props": [
    {
      "sprite": "bldg_ps_mercado",
      "x": 32,
      "y": 11.25,
      "solid": {
        "ox": 0,
        "oy": 10,
        "w": 82,
        "h": 38
      }
    },
    {
      "sprite": "bldg_ps_clinic",
      "x": 40,
      "y": 11.25,
      "solid": {
        "ox": 0,
        "oy": 10,
        "w": 82,
        "h": 38
      }
    },
    {
      "sprite": "bldg_ps_pension",
      "x": 48,
      "y": 10.25,
      "solid": {
        "ox": 0,
        "oy": 10,
        "w": 82,
        "h": 54
      }
    },
    {
      "sprite": "bldg_ps_museum",
      "x": 56,
      "y": 10.25,
      "solid": {
        "ox": 0,
        "oy": 10,
        "w": 98,
        "h": 54
      }
    },
    {
      "sprite": "bldg_ps_casa",
      "x": 65,
      "y": 10.25,
      "solid": {
        "ox": 0,
        "oy": 10,
        "w": 66,
        "h": 54
      }
    },
    {
      "sprite": "bldg_ps_casa_b",
      "x": 72,
      "y": 11.25,
      "solid": {
        "ox": 0,
        "oy": 10,
        "w": 66,
        "h": 38
      }
    },
    {
      "sprite": "bldg_ps_deli",
      "x": 70,
      "y": 22.25,
      "solid": {
        "ox": 0,
        "oy": 10,
        "w": 66,
        "h": 38
      }
    },
    {
      "sprite": "bldg_ps_pension_b",
      "x": 62,
      "y": 30.25,
      "solid": {
        "ox": 0,
        "oy": 10,
        "w": 82,
        "h": 54
      }
    },
    {
      "sprite": "bldg_ps_pension_b",
      "x": 59,
      "y": 39.25,
      "solid": {
        "ox": 0,
        "oy": 10,
        "w": 82,
        "h": 54
      }
    },
    {
      "sprite": "bldg_ps_casa_c",
      "x": 45,
      "y": 47.25,
      "solid": {
        "ox": 0,
        "oy": 10,
        "w": 66,
        "h": 38
      }
    },
    {
      "sprite": "bldg_ps_cantina",
      "x": 77,
      "y": 21.25,
      "solid": {
        "ox": 0,
        "oy": 10,
        "w": 82,
        "h": 38
      }
    },
    {
      "sprite": "bldg_ps_cantina",
      "x": 71,
      "y": 29.25,
      "solid": {
        "ox": 0,
        "oy": 10,
        "w": 82,
        "h": 38
      }
    },
    {
      "sprite": "bldg_ps_catedral",
      "x": 40,
      "y": 20.25,
      "solid": {
        "ox": 0,
        "oy": 10,
        "w": 98,
        "h": 198
      }
    },
    {
      "sprite": "bldg_ps_gran_hotel",
      "x": 67,
      "y": 36.25,
      "solid": {
        "ox": 0,
        "oy": 10,
        "w": 98,
        "h": 214
      }
    },
    {
      "sprite": "bldg_ps_aduana",
      "x": 76,
      "y": 37.25,
      "solid": {
        "ox": 0,
        "oy": 10,
        "w": 114,
        "h": 198
      }
    },
    {
      "sprite": "bldg_ps_aduana",
      "x": 86,
      "y": 37.25,
      "solid": {
        "ox": 0,
        "oy": 10,
        "w": 114,
        "h": 198
      }
    },
    {
      "sprite": "bldg_gen_market_gold_1",
      "x": 10,
      "y": 45.25,
      "solid": {
        "ox": 0,
        "oy": 10,
        "w": 98,
        "h": 38
      }
    },
    {
      "sprite": "bldg_gen_civic_paper_2",
      "x": 19,
      "y": 44.25,
      "solid": {
        "ox": 0,
        "oy": 10,
        "w": 98,
        "h": 54
      }
    },
    {
      "sprite": "puerto_headstone_sun",
      "x": 12,
      "y": 16,
      "solid": {
        "ox": 5,
        "oy": 30,
        "w": 24,
        "h": 8
      }
    },
    {
      "sprite": "puerto_headstone_anchor",
      "x": 14,
      "y": 19,
      "solid": {
        "ox": 5,
        "oy": 33,
        "w": 23,
        "h": 8
      }
    },
    {
      "sprite": "puerto_headstone_sun",
      "x": 13,
      "y": 23,
      "solid": {
        "ox": 5,
        "oy": 30,
        "w": 24,
        "h": 8
      }
    },
    {
      "sprite": "puerto_headstone_anchor",
      "x": 15,
      "y": 25,
      "solid": {
        "ox": 5,
        "oy": 33,
        "w": 23,
        "h": 8
      }
    },
    {
      "sprite": "puerto_obelisk",
      "x": 14,
      "y": 27,
      "solid": {
        "ox": 4,
        "oy": 34,
        "w": 17,
        "h": 8
      }
    },
    {
      "sprite": "puerto_headstone_anchor",
      "x": 22,
      "y": 14,
      "solid": {
        "ox": 5,
        "oy": 33,
        "w": 23,
        "h": 8
      }
    },
    {
      "sprite": "puerto_headstone_sun",
      "x": 25,
      "y": 15,
      "solid": {
        "ox": 5,
        "oy": 30,
        "w": 24,
        "h": 8
      }
    },
    {
      "sprite": "puerto_headstone_sun",
      "x": 22,
      "y": 19,
      "solid": {
        "ox": 5,
        "oy": 30,
        "w": 24,
        "h": 8
      }
    },
    {
      "sprite": "puerto_headstone_anchor",
      "x": 25,
      "y": 20,
      "solid": {
        "ox": 5,
        "oy": 33,
        "w": 23,
        "h": 8
      }
    },
    {
      "sprite": "puerto_obelisk",
      "x": 22,
      "y": 23,
      "solid": {
        "ox": 4,
        "oy": 34,
        "w": 17,
        "h": 8
      }
    },
    {
      "sprite": "puerto_headstone_sun",
      "x": 25,
      "y": 27,
      "solid": {
        "ox": 5,
        "oy": 30,
        "w": 24,
        "h": 8
      }
    },
    {
      "sprite": "puerto_crypt",
      "x": 17,
      "y": 13.8,
      "solid": {
        "ox": 6,
        "oy": 39,
        "w": 36,
        "h": 12
      }
    },
    {
      "sprite": "puerto_cemetery_gate",
      "x": 16.4,
      "y": 28.35
    },
    {
      "sprite": "puerto_cemetery_lamp",
      "x": 10.8,
      "y": 27.5,
      "solid": {
        "ox": 5,
        "oy": 36,
        "w": 10,
        "h": 8
      }
    },
    {
      "sprite": "puerto_cemetery_lamp",
      "x": 26.5,
      "y": 27.5,
      "solid": {
        "ox": 5,
        "oy": 36,
        "w": 10,
        "h": 8
      }
    },
    {
      "sprite": "pine",
      "x": 12,
      "y": 11,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "pine",
      "x": 27,
      "y": 11,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "pine",
      "x": 12,
      "y": 29,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "gazebo",
      "x": 15.8,
      "y": 33.6,
      "solid": {
        "ox": 4,
        "oy": 42,
        "w": 31,
        "h": 10
      }
    },
    {
      "sprite": "bench",
      "x": 14,
      "y": 40.2,
      "solid": {
        "ox": 1,
        "oy": 6,
        "w": 20,
        "h": 6
      }
    },
    {
      "sprite": "bench",
      "x": 22.5,
      "y": 40.2,
      "solid": {
        "ox": 1,
        "oy": 6,
        "w": 20,
        "h": 6
      }
    },
    {
      "sprite": "puerto_cemetery_lamp",
      "x": 13,
      "y": 35.4,
      "solid": {
        "ox": 5,
        "oy": 36,
        "w": 10,
        "h": 8
      }
    },
    {
      "sprite": "puerto_cemetery_lamp",
      "x": 25.5,
      "y": 36.4,
      "solid": {
        "ox": 5,
        "oy": 36,
        "w": 10,
        "h": 8
      }
    },
    {
      "sprite": "costa_flower_urns",
      "x": 20.7,
      "y": 36.1,
      "solid": {
        "ox": 5,
        "oy": 27,
        "w": 35,
        "h": 8
      }
    },
    {
      "sprite": "clothesline",
      "x": 30.5,
      "y": 23.5,
      "solid": {
        "ox": 3,
        "oy": 24,
        "w": 40,
        "h": 7
      }
    },
    {
      "sprite": "puerto_candle_cart",
      "x": 32.3,
      "y": 25.2,
      "solid": {
        "ox": 5,
        "oy": 35,
        "w": 46,
        "h": 9
      }
    },
    {
      "sprite": "well",
      "x": 36,
      "y": 28.2,
      "solid": {
        "ox": 4,
        "oy": 20,
        "w": 16,
        "h": 10
      }
    },
    {
      "sprite": "crate",
      "x": 31,
      "y": 29,
      "solid": {
        "ox": 1,
        "oy": 8,
        "w": 18,
        "h": 9
      }
    },
    {
      "sprite": "puerto_cemetery_lamp",
      "x": 38,
      "y": 28,
      "solid": {
        "ox": 5,
        "oy": 36,
        "w": 10,
        "h": 8
      }
    },
    {
      "sprite": "puerto_radio_mast",
      "x": 82,
      "y": 5.4,
      "solid": {
        "ox": 5,
        "oy": 50,
        "w": 45,
        "h": 11
      }
    },
    {
      "sprite": "puerto_luggage_cart",
      "x": 88,
      "y": 11.1,
      "solid": {
        "ox": 3,
        "oy": 25,
        "w": 37,
        "h": 8
      }
    },
    {
      "sprite": "crate",
      "x": 90.7,
      "y": 12.2,
      "solid": {
        "ox": 1,
        "oy": 8,
        "w": 18,
        "h": 9
      }
    },
    {
      "sprite": "trash_can",
      "x": 84,
      "y": 12.8,
      "solid": {
        "ox": 2,
        "oy": 10,
        "w": 10,
        "h": 7
      }
    },
    {
      "sprite": "fb_barrel",
      "x": 89.2,
      "y": 7.2,
      "solid": {
        "ox": 2,
        "oy": 18,
        "w": 14,
        "h": 7
      }
    },
    {
      "sprite": "puerto_cemetery_lamp",
      "x": 80.4,
      "y": 11,
      "solid": {
        "ox": 5,
        "oy": 36,
        "w": 10,
        "h": 8
      }
    },
    {
      "sprite": "puerto_cemetery_lamp",
      "x": 91,
      "y": 10,
      "solid": {
        "ox": 5,
        "oy": 36,
        "w": 10,
        "h": 8
      }
    },
    {
      "sprite": "fountain",
      "x": 47,
      "y": 36.4,
      "solid": {
        "ox": 3,
        "oy": 22,
        "w": 34,
        "h": 14
      }
    },
    {
      "sprite": "puerto_candle_cart",
      "x": 44.5,
      "y": 38,
      "solid": {
        "ox": 5,
        "oy": 35,
        "w": 46,
        "h": 9
      }
    },
    {
      "sprite": "bench",
      "x": 53,
      "y": 40.4,
      "solid": {
        "ox": 1,
        "oy": 6,
        "w": 20,
        "h": 6
      }
    },
    {
      "sprite": "market_stall_c",
      "x": 55,
      "y": 38,
      "solid": {
        "ox": 1,
        "oy": 14,
        "w": 38,
        "h": 14
      }
    },
    {
      "sprite": "sign",
      "x": 50,
      "y": 43.4,
      "solid": {
        "ox": 3,
        "oy": 10,
        "w": 10,
        "h": 7
      }
    },
    {
      "sprite": "festival_lantern_span",
      "x": 44.5,
      "y": 30.8
    },
    {
      "sprite": "festival_lantern_span",
      "x": 51,
      "y": 30.8
    },
    {
      "sprite": "gazebo",
      "x": 52.2,
      "y": 33.6,
      "solid": {
        "ox": 4,
        "oy": 42,
        "w": 31,
        "h": 10
      }
    },
    {
      "sprite": "banana_boat",
      "x": 20,
      "y": 55.7,
      "solid": {
        "ox": 4,
        "oy": 22,
        "w": 120,
        "h": 20
      }
    },
    {
      "sprite": "gangplank",
      "x": 25,
      "y": 59.6
    },
    {
      "sprite": "departure_board",
      "x": 29,
      "y": 55.4,
      "solid": {
        "ox": 2,
        "oy": 20,
        "w": 22,
        "h": 8
      }
    },
    {
      "sprite": "crate_bananas",
      "x": 4,
      "y": 61.2,
      "solid": {
        "ox": 1,
        "oy": 8,
        "w": 18,
        "h": 9
      }
    },
    {
      "sprite": "crate",
      "x": 6.4,
      "y": 62.1,
      "solid": {
        "ox": 1,
        "oy": 8,
        "w": 18,
        "h": 9
      }
    },
    {
      "sprite": "crate_bananas",
      "x": 32,
      "y": 62.2,
      "solid": {
        "ox": 1,
        "oy": 8,
        "w": 18,
        "h": 9
      }
    },
    {
      "sprite": "crate",
      "x": 40,
      "y": 62.4,
      "solid": {
        "ox": 1,
        "oy": 8,
        "w": 18,
        "h": 9
      }
    },
    {
      "sprite": "market_stall_a",
      "x": 56,
      "y": 61,
      "solid": {
        "ox": 1,
        "oy": 14,
        "w": 38,
        "h": 14
      }
    },
    {
      "sprite": "market_stall_b",
      "x": 62,
      "y": 61,
      "solid": {
        "ox": 1,
        "oy": 14,
        "w": 38,
        "h": 14
      }
    },
    {
      "sprite": "picnic",
      "x": 44,
      "y": 60.2,
      "solid": {
        "ox": 2,
        "oy": 8,
        "w": 32,
        "h": 14
      }
    },
    {
      "sprite": "picnic",
      "x": 96,
      "y": 60.4,
      "solid": {
        "ox": 2,
        "oy": 8,
        "w": 32,
        "h": 14
      }
    },
    {
      "sprite": "payphone",
      "x": 28,
      "y": 57,
      "solid": {
        "ox": 1,
        "oy": 10,
        "w": 14,
        "h": 16
      }
    },
    {
      "sprite": "payphone",
      "x": 92,
      "y": 59,
      "solid": {
        "ox": 1,
        "oy": 10,
        "w": 14,
        "h": 16
      }
    },
    {
      "sprite": "departure_board",
      "x": 82,
      "y": 59,
      "solid": {
        "ox": 2,
        "oy": 20,
        "w": 22,
        "h": 8
      }
    },
    {
      "sprite": "puerto_harbor_bell",
      "x": 13,
      "y": 56.4,
      "solid": {
        "ox": 7,
        "oy": 37,
        "w": 37,
        "h": 10
      }
    },
    {
      "sprite": "puerto_ticket_kiosk",
      "x": 34,
      "y": 56.2,
      "solid": {
        "ox": 4,
        "oy": 44,
        "w": 40,
        "h": 10
      }
    },
    {
      "sprite": "puerto_mooring_bollards",
      "x": 18,
      "y": 63,
      "solid": {
        "ox": 3,
        "oy": 10,
        "w": 26,
        "h": 7
      }
    },
    {
      "sprite": "puerto_mooring_bollards",
      "x": 35,
      "y": 63,
      "solid": {
        "ox": 3,
        "oy": 10,
        "w": 26,
        "h": 7
      }
    },
    {
      "sprite": "puerto_cargo_crane",
      "x": 69,
      "y": 55.9,
      "solid": {
        "ox": 5,
        "oy": 50,
        "w": 48,
        "h": 12
      }
    },
    {
      "sprite": "puerto_fish_stall",
      "x": 75,
      "y": 59.9,
      "solid": {
        "ox": 2,
        "oy": 30,
        "w": 40,
        "h": 11
      }
    },
    {
      "sprite": "fb_rope_coil",
      "x": 79.2,
      "y": 62.6
    },
    {
      "sprite": "fb_crab_pot",
      "x": 80.8,
      "y": 61.5,
      "solid": {
        "ox": 2,
        "oy": 19,
        "w": 14,
        "h": 7
      }
    },
    {
      "sprite": "puerto_luggage_cart",
      "x": 84.8,
      "y": 60.2,
      "solid": {
        "ox": 3,
        "oy": 25,
        "w": 37,
        "h": 8
      }
    },
    {
      "sprite": "puerto_cemetery_lamp",
      "x": 8,
      "y": 57,
      "solid": {
        "ox": 5,
        "oy": 36,
        "w": 10,
        "h": 8
      }
    },
    {
      "sprite": "puerto_cemetery_lamp",
      "x": 42,
      "y": 57,
      "solid": {
        "ox": 5,
        "oy": 36,
        "w": 10,
        "h": 8
      }
    },
    {
      "sprite": "puerto_cemetery_lamp",
      "x": 72,
      "y": 57,
      "solid": {
        "ox": 5,
        "oy": 36,
        "w": 10,
        "h": 8
      }
    },
    {
      "sprite": "puerto_cemetery_lamp",
      "x": 88,
      "y": 57,
      "solid": {
        "ox": 5,
        "oy": 36,
        "w": 10,
        "h": 8
      }
    },
    {
      "sprite": "traffic_light",
      "x": 11,
      "y": 49,
      "solid": {
        "ox": 4,
        "oy": 38,
        "w": 6,
        "h": 8
      }
    },
    {
      "sprite": "traffic_light",
      "x": 31,
      "y": 49,
      "solid": {
        "ox": 4,
        "oy": 38,
        "w": 6,
        "h": 8
      }
    },
    {
      "sprite": "traffic_light",
      "x": 63,
      "y": 15,
      "solid": {
        "ox": 4,
        "oy": 38,
        "w": 6,
        "h": 8
      }
    },
    {
      "sprite": "stop_sign",
      "x": 4,
      "y": 50,
      "solid": {
        "ox": 4,
        "oy": 21,
        "w": 5,
        "h": 6
      }
    },
    {
      "sprite": "stop_sign",
      "x": 94,
      "y": 56,
      "solid": {
        "ox": 4,
        "oy": 21,
        "w": 5,
        "h": 6
      }
    },
    {
      "sprite": "gift_box",
      "x": 22,
      "y": 61,
      "solid": {
        "ox": 1,
        "oy": 7,
        "w": 12,
        "h": 6
      },
      "unlessFlag": "ps_dock_gift"
    },
    {
      "sprite": "gift_box_open",
      "x": 22,
      "y": 61,
      "solid": {
        "ox": 1,
        "oy": 7,
        "w": 12,
        "h": 6
      },
      "ifFlag": "ps_dock_gift"
    },
    {
      "sprite": "gift_box",
      "x": 59,
      "y": 62.6,
      "solid": {
        "ox": 1,
        "oy": 7,
        "w": 12,
        "h": 6
      },
      "unlessFlag": "mercado_stall"
    },
    {
      "sprite": "gift_box_open",
      "x": 59,
      "y": 62.6,
      "solid": {
        "ox": 1,
        "oy": 7,
        "w": 12,
        "h": 6
      },
      "ifFlag": "mercado_stall"
    },
    {
      "sprite": "gift_box",
      "x": 90,
      "y": 61.6,
      "solid": {
        "ox": 1,
        "oy": 7,
        "w": 12,
        "h": 6
      },
      "unlessFlag": "gift_doubloon"
    },
    {
      "sprite": "gift_box_open",
      "x": 90,
      "y": 61.6,
      "solid": {
        "ox": 1,
        "oy": 7,
        "w": 12,
        "h": 6
      },
      "ifFlag": "gift_doubloon"
    },
    {
      "sprite": "edge_rock_a",
      "x": 96,
      "y": 49.5,
      "solid": {
        "ox": 8,
        "oy": 20,
        "w": 16,
        "h": 8
      }
    },
    {
      "sprite": "edge_rock_b",
      "x": 96,
      "y": 57.5,
      "solid": {
        "ox": 8,
        "oy": 20,
        "w": 16,
        "h": 8
      }
    },
    {
      "sprite": "sign",
      "x": 6,
      "y": 1,
      "solid": {
        "ox": 3,
        "oy": 10,
        "w": 10,
        "h": 7
      }
    },
    {
      "sprite": "sign",
      "x": 30,
      "y": 60.4,
      "solid": {
        "ox": 3,
        "oy": 10,
        "w": 10,
        "h": 7
      }
    },
    {
      "sprite": "sign",
      "x": 52,
      "y": 60.4,
      "solid": {
        "ox": 3,
        "oy": 10,
        "w": 10,
        "h": 7
      }
    },
    {
      "sprite": "sign",
      "x": 56,
      "y": 60.4,
      "solid": {
        "ox": 3,
        "oy": 10,
        "w": 10,
        "h": 7
      }
    },
    {
      "sprite": "sign",
      "x": 12,
      "y": 29.4,
      "solid": {
        "ox": 3,
        "oy": 10,
        "w": 10,
        "h": 7
      }
    },
    {
      "sprite": "sign",
      "x": 25,
      "y": 39.4,
      "solid": {
        "ox": 3,
        "oy": 10,
        "w": 10,
        "h": 7
      }
    },
    {
      "sprite": "sign",
      "x": 35,
      "y": 30.4,
      "solid": {
        "ox": 3,
        "oy": 10,
        "w": 10,
        "h": 7
      }
    },
    {
      "sprite": "sign",
      "x": 85,
      "y": 12.4,
      "solid": {
        "ox": 3,
        "oy": 10,
        "w": 10,
        "h": 7
      }
    },
    {
      "sprite": "sign",
      "x": 13,
      "y": 60.4,
      "solid": {
        "ox": 3,
        "oy": 10,
        "w": 10,
        "h": 7
      }
    },
    {
      "sprite": "sign",
      "x": 76,
      "y": 63.4,
      "solid": {
        "ox": 3,
        "oy": 10,
        "w": 10,
        "h": 7
      }
    },
    {
      "sprite": "sign",
      "x": 97,
      "y": 52.4,
      "solid": {
        "ox": 3,
        "oy": 10,
        "w": 10,
        "h": 7
      }
    },
    {
      "sprite": "sign",
      "x": 95,
      "y": 54.4,
      "solid": {
        "ox": 3,
        "oy": 10,
        "w": 10,
        "h": 7
      }
    },
    {
      "sprite": "tree_c",
      "x": 12,
      "y": 59,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 48,
      "y": 58.8,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 70,
      "y": 59,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 86,
      "y": 58.8,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 98,
      "y": 59,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 11,
      "y": 6,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 47,
      "y": 6,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 14,
      "y": 7,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 40,
      "y": 7,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 10,
      "y": 8,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 41,
      "y": 8,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "pine",
      "x": 30,
      "y": 9,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 37,
      "y": 9,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "pine",
      "x": 43,
      "y": 9,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 79,
      "y": 14,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 31,
      "y": 21,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 32,
      "y": 21,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 35,
      "y": 21,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 48,
      "y": 21,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 68,
      "y": 21,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 47,
      "y": 22,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 51,
      "y": 22,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 55,
      "y": 22,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 87,
      "y": 22,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 40,
      "y": 23,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 50,
      "y": 23,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 66,
      "y": 23,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 67,
      "y": 23,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 94,
      "y": 23,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 92,
      "y": 25,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 93,
      "y": 25,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 50,
      "y": 26,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 91,
      "y": 26,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 51,
      "y": 27,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 79,
      "y": 27,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 91,
      "y": 28,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 90,
      "y": 29,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 91,
      "y": 29,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 78,
      "y": 30,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 79,
      "y": 30,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 91,
      "y": 30,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 38,
      "y": 32,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 88,
      "y": 32,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 31,
      "y": 33,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 32,
      "y": 33,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 34,
      "y": 33,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 35,
      "y": 33,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 85,
      "y": 33,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 30,
      "y": 34,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 31,
      "y": 34,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 37,
      "y": 34,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 84,
      "y": 34,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 77,
      "y": 35,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 80,
      "y": 35,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 82,
      "y": 35,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 10,
      "y": 36,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 59,
      "y": 36,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 71,
      "y": 36,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 76,
      "y": 36,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "pine",
      "x": 93,
      "y": 36,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 60,
      "y": 37,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 75,
      "y": 37,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 93,
      "y": 37,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 85,
      "y": 38,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 91,
      "y": 38,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 29,
      "y": 39,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 40,
      "y": 39,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 86,
      "y": 39,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 39,
      "y": 40,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 29,
      "y": 42,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 10,
      "y": 43,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 35,
      "y": 44,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 31,
      "y": 46,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 35,
      "y": 46,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 56,
      "y": 46,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 51,
      "y": 47,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 29,
      "y": 48,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 32,
      "y": 48,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 33,
      "y": 48,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 41,
      "y": 49,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 51,
      "y": 49,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 53,
      "y": 50,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 8,
      "y": 57,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 25,
      "y": 57,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 32,
      "y": 57,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 45,
      "y": 57,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree",
      "x": 48,
      "y": 57,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 62,
      "y": 57,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_b",
      "x": 67,
      "y": 57,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    },
    {
      "sprite": "tree_c",
      "x": 68,
      "y": 57,
      "solid": {
        "ox": 7,
        "oy": 22,
        "w": 12,
        "h": 10
      }
    }
  ],
  "npcs": [
    {
      "id": "ps_fisher",
      "sprite": "dockworker",
      "x": 10,
      "y": 58,
      "facing": "down",
      "dialogue": "npc_ps_fisher",
      "wander": true,
      "emote": "think"
    },
    {
      "id": "ps_crane",
      "sprite": "dockworker",
      "x": 46,
      "y": 58,
      "facing": "down",
      "dialogue": "npc_ps_crane",
      "wander": true
    },
    {
      "id": "ps_tally",
      "sprite": "captain",
      "x": 76,
      "y": 58,
      "facing": "down",
      "dialogue": "npc_ps_tally"
    },
    {
      "id": "ps_board",
      "sprite": "tomas",
      "x": 82,
      "y": 57,
      "facing": "down",
      "dialogue": "npc_ps_board"
    },
    {
      "id": "ps_porter",
      "sprite": "captain",
      "x": 65,
      "y": 50,
      "facing": "down",
      "dialogue": "npc_ps_porter"
    },
    {
      "id": "ps_nina",
      "sprite": "wokeB",
      "x": 50,
      "y": 37,
      "facing": "down",
      "dialogue": "npc_ps_nina",
      "wander": true
    },
    {
      "id": "ps_plaza_musician",
      "sprite": "pigeonKid",
      "x": 53,
      "y": 37,
      "facing": "down",
      "dialogue": "npc_ps_plaza_musician",
      "idle": true,
      "emote": "happy"
    },
    {
      "id": "ps_stallman",
      "sprite": "tomas",
      "x": 63,
      "y": 62,
      "facing": "down",
      "dialogue": "npc_ps_stall",
      "unlessFlag": "q_llama",
      "idle": true,
      "emote": "happy"
    },
    {
      "id": "ps_market",
      "sprite": "mercadoKeeper",
      "x": 55,
      "y": 39,
      "facing": "down",
      "dialogue": "npc_ps_market",
      "wander": true
    },
    {
      "id": "ps_gravedigger",
      "sprite": "quarterMan",
      "x": 23,
      "y": 29,
      "facing": "left",
      "dialogue": "npc_ps_gravedigger",
      "idle": true,
      "emote": "think"
    },
    {
      "id": "ps_mourner",
      "sprite": "senora",
      "x": 18,
      "y": 39,
      "facing": "up",
      "dialogue": "npc_ps_mourner",
      "idle": true
    },
    {
      "id": "ps_candle_vendor",
      "sprite": "mercadoKeeper",
      "x": 34,
      "y": 27,
      "facing": "down",
      "dialogue": "npc_ps_candle_vendor",
      "idle": true,
      "emote": "happy"
    },
    {
      "id": "ps_radio_watcher",
      "sprite": "oldTimer",
      "x": 85,
      "y": 12,
      "facing": "up",
      "dialogue": "npc_ps_radio_watcher",
      "idle": true,
      "emote": "think"
    },
    {
      "id": "ps_fishmonger",
      "sprite": "tomas",
      "x": 78,
      "y": 62,
      "facing": "down",
      "dialogue": "npc_ps_fishmonger",
      "wander": true
    }
  ],
  "signs": [
    {
      "x": 6,
      "y": 1,
      "dialogue": "sign_costa_road"
    },
    {
      "x": 30,
      "y": 60,
      "dialogue": "sign_departures_home"
    },
    {
      "x": 52,
      "y": 60,
      "dialogue": "sign_ps_malecon"
    },
    {
      "x": 56,
      "y": 60,
      "dialogue": "sign_ps_market"
    },
    {
      "x": 12,
      "y": 29,
      "dialogue": "sign_ps_campo_viejo"
    },
    {
      "x": 25,
      "y": 39,
      "dialogue": "sign_ps_moonwake"
    },
    {
      "x": 35,
      "y": 30,
      "dialogue": "sign_ps_candleworks"
    },
    {
      "x": 85,
      "y": 12,
      "dialogue": "sign_ps_radio"
    },
    {
      "x": 13,
      "y": 60,
      "dialogue": "sign_ps_harbor_bell"
    },
    {
      "x": 76,
      "y": 63,
      "dialogue": "sign_ps_fish_auction"
    },
    {
      "x": 97,
      "y": 52,
      "dialogue": "sign_jungle_gate"
    },
    {
      "x": 95,
      "y": 54,
      "dialogue": "sign_ps_jungle_east"
    },
    {
      "x": 50,
      "y": 43,
      "dialogue": "sign_plaza"
    },
    {
      "x": 22,
      "y": 62,
      "dialogue": "ps_dock_gift",
      "unlessFlag": "ps_dock_gift"
    },
    {
      "x": 22,
      "y": 62,
      "dialogue": "ps_dock_gift_done",
      "ifFlag": "ps_dock_gift"
    },
    {
      "x": 59,
      "y": 63.6,
      "dialogue": "mercado_stall",
      "unlessFlag": "mercado_stall"
    },
    {
      "x": 59,
      "y": 63.6,
      "dialogue": "mercado_stall_done",
      "ifFlag": "mercado_stall"
    },
    {
      "x": 90,
      "y": 62.6,
      "dialogue": "gift_doubloon",
      "unlessFlag": "gift_doubloon"
    },
    {
      "x": 90,
      "y": 62.6,
      "dialogue": "gift_doubloon_done",
      "ifFlag": "gift_doubloon"
    }
  ],
  "phones": [
    {
      "x": 28,
      "y": 57
    },
    {
      "x": 92,
      "y": 59
    }
  ],
  "atms": [],
  "doors": [
    {
      "x": 6,
      "y": 0,
      "w": 3,
      "h": 1,
      "to": "costa_estrella",
      "tx": 216,
      "ty": 232,
      "facing": "up"
    },
    {
      "x": 99,
      "y": 52,
      "w": 1,
      "h": 4,
      "to": "jungle_1",
      "tx": 24,
      "ty": 264,
      "facing": "right"
    }
  ],
  "spawners": [
    {
      "enemies": [
        "pickpocket_parrot",
        "brass_market_mimic"
      ],
      "count": 1,
      "rect": {
        "x": 31,
        "y": 38,
        "w": 10,
        "h": 6
      }
    }
  ],
  "triggers": [
    {
      "id": "board_boat_return",
      "rect": {
        "x": 25,
        "y": 60,
        "w": 2,
        "h": 2
      },
      "once": false
    },
    {
      "id": "puerto_arrival",
      "rect": {
        "x": 23,
        "y": 58,
        "w": 6,
        "h": 2
      },
      "once": true
    },
    {
      "id": "puerto_malecon",
      "rect": {
        "x": 50,
        "y": 61,
        "w": 3,
        "h": 4
      },
      "once": true
    }
  ],
  "patrols": [],
  "reflect": [
    {
      "x": 0,
      "y": 66,
      "w": 100,
      "h": 5,
      "within": 6
    }
  ]
};
