import type { LanguageData } from '../../types';

import aaData from './aa';
import abData from './ab';
import aeData from './ae';
import afData from './af';
import akData from './ak';
import amData from './am';
import anData from './an';
import arData from './ar';
import asData from './as';
import avData from './av';
import ayData from './ay';
import azData from './az';
import baData from './ba';
import beData from './be';
import bgData from './bg';
import bhData from './bh';
import biData from './bi';
import bmData from './bm';
import bnData from './bn';
import boData from './bo';
import brData from './br';
import bsData from './bs';
import caData from './ca';
import ceData from './ce';
import chData from './ch';
import coData from './co';
import crData from './cr';
import csData from './cs';
import cuData from './cu';
import cvData from './cv';
import cyData from './cy';
import daData from './da';
import deData from './de';
import dvData from './dv';
import dzData from './dz';
import eeData from './ee';
import elData from './el';
import enData from './en';
import eoData from './eo';
import esData from './es';
import etData from './et';
import euData from './eu';
import faData from './fa';
import ffData from './ff';
import fiData from './fi';
import fjData from './fj';
import foData from './fo';
import frData from './fr';
import fyData from './fy';
import gaData from './ga';
import gdData from './gd';
import glData from './gl';
import gnData from './gn';
import guData from './gu';
import gvData from './gv';
import haData from './ha';
import heData from './he';
import hiData from './hi';
import hoData from './ho';
import hrData from './hr';
import htData from './ht';
import huData from './hu';
import hyData from './hy';
import hzData from './hz';
import iaData from './ia';
import idData from './id';
import ieData from './ie';
import igData from './ig';
import iiData from './ii';
import ikData from './ik';
import inData from './in';
import ioData from './io';
import isData from './is';
import itData from './it';
import iuData from './iu';
import iwData from './iw';
import jaData from './ja';
import jiData from './ji';
import jvData from './jv';
import jwData from './jw';
import kaData from './ka';
import kgData from './kg';
import kiData from './ki';
import kjData from './kj';
import kkData from './kk';
import klData from './kl';
import kmData from './km';
import knData from './kn';
import koData from './ko';
import krData from './kr';
import ksData from './ks';
import kuData from './ku';
import kvData from './kv';
import kwData from './kw';
import kyData from './ky';
import laData from './la';
import lbData from './lb';
import lgData from './lg';
import liData from './li';
import lnData from './ln';
import loData from './lo';
import ltData from './lt';
import luData from './lu';
import lvData from './lv';
import mgData from './mg';
import mhData from './mh';
import miData from './mi';
import mkData from './mk';
import mlData from './ml';
import mnData from './mn';
import moData from './mo';
import mrData from './mr';
import msData from './ms';
import mtData from './mt';
import myData from './my';
import naData from './na';
import nbData from './nb';
import ndData from './nd';
import neData from './ne';
import ngData from './ng';
import nlData from './nl';
import nnData from './nn';
import noData from './no';
import nrData from './nr';
import nvData from './nv';
import nyData from './ny';
import ocData from './oc';
import ojData from './oj';
import omData from './om';
import orData from './or';
import osData from './os';
import paData from './pa';
import piData from './pi';
import plData from './pl';
import psData from './ps';
import ptData from './pt';
import quData from './qu';
import rmData from './rm';
import rnData from './rn';
import roData from './ro';
import ruData from './ru';
import rwData from './rw';
import saData from './sa';
import scData from './sc';
import sdData from './sd';
import seData from './se';
import sgData from './sg';
import shData from './sh';
import siData from './si';
import skData from './sk';
import slData from './sl';
import smData from './sm';
import snData from './sn';
import soData from './so';
import sqData from './sq';
import srData from './sr';
import ssData from './ss';
import stData from './st';
import suData from './su';
import svData from './sv';
import swData from './sw';
import taData from './ta';
import teData from './te';
import tgData from './tg';
import thData from './th';
import tiData from './ti';
import tkData from './tk';
import tlData from './tl';
import tnData from './tn';
import toData from './to';
import trData from './tr';
import tsData from './ts';
import ttData from './tt';
import twData from './tw';
import tyData from './ty';
import ugData from './ug';
import ukData from './uk';
import urData from './ur';
import uzData from './uz';
import veData from './ve';
import viData from './vi';
import voData from './vo';
import waData from './wa';
import woData from './wo';
import xhData from './xh';
import yiData from './yi';
import yoData from './yo';
import zaData from './za';
import zhData from './zh';
import zuData from './zu';

// Use a Map to avoid issues with reserved words
export const languageMap = new Map<string, LanguageData>([
  ['aa', aaData],
  ['ab', abData],
  ['ae', aeData],
  ['af', afData],
  ['ak', akData],
  ['am', amData],
  ['an', anData],
  ['ar', arData],
  ['as', asData],
  ['av', avData],
  ['ay', ayData],
  ['az', azData],
  ['ba', baData],
  ['be', beData],
  ['bg', bgData],
  ['bh', bhData],
  ['bi', biData],
  ['bm', bmData],
  ['bn', bnData],
  ['bo', boData],
  ['br', brData],
  ['bs', bsData],
  ['ca', caData],
  ['ce', ceData],
  ['ch', chData],
  ['co', coData],
  ['cr', crData],
  ['cs', csData],
  ['cu', cuData],
  ['cv', cvData],
  ['cy', cyData],
  ['da', daData],
  ['de', deData],
  ['dv', dvData],
  ['dz', dzData],
  ['ee', eeData],
  ['el', elData],
  ['en', enData],
  ['eo', eoData],
  ['es', esData],
  ['et', etData],
  ['eu', euData],
  ['fa', faData],
  ['ff', ffData],
  ['fi', fiData],
  ['fj', fjData],
  ['fo', foData],
  ['fr', frData],
  ['fy', fyData],
  ['ga', gaData],
  ['gd', gdData],
  ['gl', glData],
  ['gn', gnData],
  ['gu', guData],
  ['gv', gvData],
  ['ha', haData],
  ['he', heData],
  ['hi', hiData],
  ['ho', hoData],
  ['hr', hrData],
  ['ht', htData],
  ['hu', huData],
  ['hy', hyData],
  ['hz', hzData],
  ['ia', iaData],
  ['id', idData],
  ['ie', ieData],
  ['ig', igData],
  ['ii', iiData],
  ['ik', ikData],
  ['in', inData],
  ['io', ioData],
  ['is', isData],
  ['it', itData],
  ['iu', iuData],
  ['iw', iwData],
  ['ja', jaData],
  ['ji', jiData],
  ['jv', jvData],
  ['jw', jwData],
  ['ka', kaData],
  ['kg', kgData],
  ['ki', kiData],
  ['kj', kjData],
  ['kk', kkData],
  ['kl', klData],
  ['km', kmData],
  ['kn', knData],
  ['ko', koData],
  ['kr', krData],
  ['ks', ksData],
  ['ku', kuData],
  ['kv', kvData],
  ['kw', kwData],
  ['ky', kyData],
  ['la', laData],
  ['lb', lbData],
  ['lg', lgData],
  ['li', liData],
  ['ln', lnData],
  ['lo', loData],
  ['lt', ltData],
  ['lu', luData],
  ['lv', lvData],
  ['mg', mgData],
  ['mh', mhData],
  ['mi', miData],
  ['mk', mkData],
  ['ml', mlData],
  ['mn', mnData],
  ['mo', moData],
  ['mr', mrData],
  ['ms', msData],
  ['mt', mtData],
  ['my', myData],
  ['na', naData],
  ['nb', nbData],
  ['nd', ndData],
  ['ne', neData],
  ['ng', ngData],
  ['nl', nlData],
  ['nn', nnData],
  ['no', noData],
  ['nr', nrData],
  ['nv', nvData],
  ['ny', nyData],
  ['oc', ocData],
  ['oj', ojData],
  ['om', omData],
  ['or', orData],
  ['os', osData],
  ['pa', paData],
  ['pi', piData],
  ['pl', plData],
  ['ps', psData],
  ['pt', ptData],
  ['qu', quData],
  ['rm', rmData],
  ['rn', rnData],
  ['ro', roData],
  ['ru', ruData],
  ['rw', rwData],
  ['sa', saData],
  ['sc', scData],
  ['sd', sdData],
  ['se', seData],
  ['sg', sgData],
  ['sh', shData],
  ['si', siData],
  ['sk', skData],
  ['sl', slData],
  ['sm', smData],
  ['sn', snData],
  ['so', soData],
  ['sq', sqData],
  ['sr', srData],
  ['ss', ssData],
  ['st', stData],
  ['su', suData],
  ['sv', svData],
  ['sw', swData],
  ['ta', taData],
  ['te', teData],
  ['tg', tgData],
  ['th', thData],
  ['ti', tiData],
  ['tk', tkData],
  ['tl', tlData],
  ['tn', tnData],
  ['to', toData],
  ['tr', trData],
  ['ts', tsData],
  ['tt', ttData],
  ['tw', twData],
  ['ty', tyData],
  ['ug', ugData],
  ['uk', ukData],
  ['ur', urData],
  ['uz', uzData],
  ['ve', veData],
  ['vi', viData],
  ['vo', voData],
  ['wa', waData],
  ['wo', woData],
  ['xh', xhData],
  ['yi', yiData],
  ['yo', yoData],
  ['za', zaData],
  ['zh', zhData],
  ['zu', zuData]
]);

export const languages = Array.from(languageMap.values());
