import React, { Component } from 'react';
import PropTypes from 'prop-types';
//import { connect } from 'react-redux';
//import { push } from 'react-router-redux';
import * as d3 from 'd3';
import { max } from 'moment';
//import { Row, Form } from 'antd';

const graph = {
  nodes: [
    {id: 'Myriel', group: 1},
    {id: 'Napoleon', group: 1},
    {id: 'Mlle.Baptistine', group: 1},
    {id: 'Mme.Magloire', group: 1},
    {id: 'CountessdeLo', group: 1},
    {id: 'Geborand', group: 1},
    {id: 'Champtercier', group: 1},
    {id: 'Cravatte', group: 1},
    {id: 'Count', group: 1},
    {id: 'OldMan', group: 1},
    {id: 'Labarre', group: 2},
    {id: 'Valjean', group: 2},
    {id: 'Marguerite', group: 3},
    {id: 'Mme.deR', group: 2},
    {id: 'Isabeau', group: 2},
    {id: 'Gervais', group: 2},
    {id: 'Tholomyes', group: 3},
    {id: 'Listolier', group: 3},
    {id: 'Fameuil', group: 3},
    {id: 'Blacheville', group: 3},
    {id: 'Favourite', group: 3},
    {id: 'Dahlia', group: 3},
    {id: 'Zephine', group: 3},
    {id: 'Fantine', group: 3},
    {id: 'Mme.Thenardier', group: 4},
    {id: 'Thenardier', group: 4},
    {id: 'Cosette', group: 5},
    {id: 'Javert', group: 4},
    {id: 'Fauchelevent', group: 0},
    {id: 'Bamatabois', group: 2},
    {id: 'Perpetue', group: 3},
    {id: 'Simplice', group: 2},
    {id: 'Scaufflaire', group: 2},
    {id: 'Woman1', group: 2},
    {id: 'Judge', group: 2},
    {id: 'Champmathieu', group: 2},
    {id: 'Brevet', group: 2},
    {id: 'Chenildieu', group: 2},
    {id: 'Cochepaille', group: 2},
    {id: 'Pontmercy', group: 4},
    {id: 'Boulatruelle', group: 6},
    {id: 'Eponine', group: 4},
    {id: 'Anzelma', group: 4},
    {id: 'Woman2', group: 5},
    {id: 'MotherInnocent', group: 0},
    {id: 'Gribier', group: 0},
    {id: 'Jondrette', group: 7},
    {id: 'Mme.Burgon', group: 7},
    {id: 'Gavroche', group: 8},
    {id: 'Gillenormand', group: 5},
    {id: 'Magnon', group: 5},
    {id: 'Mlle.Gillenormand', group: 5},
    {id: 'Mme.Pontmercy', group: 5},
    {id: 'Mlle.Vaubois', group: 5},
    {id: 'Lt.Gillenormand', group: 5},
    {id: 'Marius', group: 8},
    {id: 'BaronessT', group: 5},
    {id: 'Mabeuf', group: 8},
    {id: 'Enjolras', group: 8},
    {id: 'Combeferre', group: 8},
    {id: 'Prouvaire', group: 8},
    {id: 'Feuilly', group: 8},
    {id: 'Courfeyrac', group: 8},
    {id: 'Bahorel', group: 8},
    {id: 'Bossuet', group: 8},
    {id: 'Joly', group: 8},
    {id: 'Grantaire', group: 8},
    {id: 'MotherPlutarch', group: 9},
    {id: 'Gueulemer', group: 4},
    {id: 'Babet', group: 4},
    {id: 'Claquesous', group: 4},
    {id: 'Montparnasse', group: 4},
    {id: 'Toussaint', group: 5},
    {id: 'Child1', group: 10},
    {id: 'Child2', group: 10},
    {id: 'Brujon', group: 4},
    {id: 'Mme.Hucheloup', group: 8}
  ],
  'links': [
    {'source': 'Napoleon', 'target': 'Myriel', 'value': 1},
    {'source': 'Mlle.Baptistine', 'target': 'Myriel', 'value': 8},
    {'source': 'Mme.Magloire', 'target': 'Myriel', 'value': 10},
    {'source': 'Mme.Magloire', 'target': 'Mlle.Baptistine', 'value': 6},
    {'source': 'CountessdeLo', 'target': 'Myriel', 'value': 1},
    {'source': 'Geborand', 'target': 'Myriel', 'value': 1},
    {'source': 'Champtercier', 'target': 'Myriel', 'value': 1},
    {'source': 'Cravatte', 'target': 'Myriel', 'value': 1},
    {'source': 'Count', 'target': 'Myriel', 'value': 2},
    {'source': 'OldMan', 'target': 'Myriel', 'value': 1},
    {'source': 'Valjean', 'target': 'Labarre', 'value': 1},
    {'source': 'Valjean', 'target': 'Mme.Magloire', 'value': 3},
    {'source': 'Valjean', 'target': 'Mlle.Baptistine', 'value': 3},
    {'source': 'Valjean', 'target': 'Myriel', 'value': 5},
    {'source': 'Marguerite', 'target': 'Valjean', 'value': 1},
    {'source': 'Mme.deR', 'target': 'Valjean', 'value': 1},
    {'source': 'Isabeau', 'target': 'Valjean', 'value': 1},
    {'source': 'Gervais', 'target': 'Valjean', 'value': 1},
    {'source': 'Listolier', 'target': 'Tholomyes', 'value': 4},
    {'source': 'Fameuil', 'target': 'Tholomyes', 'value': 4},
    {'source': 'Fameuil', 'target': 'Listolier', 'value': 4},
    {'source': 'Blacheville', 'target': 'Tholomyes', 'value': 4},
    {'source': 'Blacheville', 'target': 'Listolier', 'value': 4},
    {'source': 'Blacheville', 'target': 'Fameuil', 'value': 4},
    {'source': 'Favourite', 'target': 'Tholomyes', 'value': 3},
    {'source': 'Favourite', 'target': 'Listolier', 'value': 3},
    {'source': 'Favourite', 'target': 'Fameuil', 'value': 3},
    {'source': 'Favourite', 'target': 'Blacheville', 'value': 4},
    {'source': 'Dahlia', 'target': 'Tholomyes', 'value': 3},
    {'source': 'Dahlia', 'target': 'Listolier', 'value': 3},
    {'source': 'Dahlia', 'target': 'Fameuil', 'value': 3},
    {'source': 'Dahlia', 'target': 'Blacheville', 'value': 3},
    {'source': 'Dahlia', 'target': 'Favourite', 'value': 5},
    {'source': 'Zephine', 'target': 'Tholomyes', 'value': 3},
    {'source': 'Zephine', 'target': 'Listolier', 'value': 3},
    {'source': 'Zephine', 'target': 'Fameuil', 'value': 3},
    {'source': 'Zephine', 'target': 'Blacheville', 'value': 3},
    {'source': 'Zephine', 'target': 'Favourite', 'value': 4},
    {'source': 'Zephine', 'target': 'Dahlia', 'value': 4},
    {'source': 'Fantine', 'target': 'Tholomyes', 'value': 3},
    {'source': 'Fantine', 'target': 'Listolier', 'value': 3},
    {'source': 'Fantine', 'target': 'Fameuil', 'value': 3},
    {'source': 'Fantine', 'target': 'Blacheville', 'value': 3},
    {'source': 'Fantine', 'target': 'Favourite', 'value': 4},
    {'source': 'Fantine', 'target': 'Dahlia', 'value': 4},
    {'source': 'Fantine', 'target': 'Zephine', 'value': 4},
    {'source': 'Fantine', 'target': 'Marguerite', 'value': 2},
    {'source': 'Fantine', 'target': 'Valjean', 'value': 9},
    {'source': 'Mme.Thenardier', 'target': 'Fantine', 'value': 2},
    {'source': 'Mme.Thenardier', 'target': 'Valjean', 'value': 7},
    {'source': 'Thenardier', 'target': 'Mme.Thenardier', 'value': 13},
    {'source': 'Thenardier', 'target': 'Fantine', 'value': 1},
    {'source': 'Thenardier', 'target': 'Valjean', 'value': 12},
    {'source': 'Cosette', 'target': 'Mme.Thenardier', 'value': 4},
    {'source': 'Cosette', 'target': 'Valjean', 'value': 31},
    {'source': 'Cosette', 'target': 'Tholomyes', 'value': 1},
    {'source': 'Cosette', 'target': 'Thenardier', 'value': 1},
    {'source': 'Javert', 'target': 'Valjean', 'value': 17},
    {'source': 'Javert', 'target': 'Fantine', 'value': 5},
    {'source': 'Javert', 'target': 'Thenardier', 'value': 5},
    {'source': 'Javert', 'target': 'Mme.Thenardier', 'value': 1},
    {'source': 'Javert', 'target': 'Cosette', 'value': 1},
    {'source': 'Fauchelevent', 'target': 'Valjean', 'value': 8},
    {'source': 'Fauchelevent', 'target': 'Javert', 'value': 1},
    {'source': 'Bamatabois', 'target': 'Fantine', 'value': 1},
    {'source': 'Bamatabois', 'target': 'Javert', 'value': 1},
    {'source': 'Bamatabois', 'target': 'Valjean', 'value': 2},
    {'source': 'Perpetue', 'target': 'Fantine', 'value': 1},
    {'source': 'Simplice', 'target': 'Perpetue', 'value': 2},
    {'source': 'Simplice', 'target': 'Valjean', 'value': 3},
    {'source': 'Simplice', 'target': 'Fantine', 'value': 2},
    {'source': 'Simplice', 'target': 'Javert', 'value': 1},
    {'source': 'Scaufflaire', 'target': 'Valjean', 'value': 1},
    {'source': 'Woman1', 'target': 'Valjean', 'value': 2},
    {'source': 'Woman1', 'target': 'Javert', 'value': 1},
    {'source': 'Judge', 'target': 'Valjean', 'value': 3},
    {'source': 'Judge', 'target': 'Bamatabois', 'value': 2},
    {'source': 'Champmathieu', 'target': 'Valjean', 'value': 3},
    {'source': 'Champmathieu', 'target': 'Judge', 'value': 3},
    {'source': 'Champmathieu', 'target': 'Bamatabois', 'value': 2},
    {'source': 'Brevet', 'target': 'Judge', 'value': 2},
    {'source': 'Brevet', 'target': 'Champmathieu', 'value': 2},
    {'source': 'Brevet', 'target': 'Valjean', 'value': 2},
    {'source': 'Brevet', 'target': 'Bamatabois', 'value': 1},
    {'source': 'Chenildieu', 'target': 'Judge', 'value': 2},
    {'source': 'Chenildieu', 'target': 'Champmathieu', 'value': 2},
    {'source': 'Chenildieu', 'target': 'Brevet', 'value': 2},
    {'source': 'Chenildieu', 'target': 'Valjean', 'value': 2},
    {'source': 'Chenildieu', 'target': 'Bamatabois', 'value': 1},
    {'source': 'Cochepaille', 'target': 'Judge', 'value': 2},
    {'source': 'Cochepaille', 'target': 'Champmathieu', 'value': 2},
    {'source': 'Cochepaille', 'target': 'Brevet', 'value': 2},
    {'source': 'Cochepaille', 'target': 'Chenildieu', 'value': 2},
    {'source': 'Cochepaille', 'target': 'Valjean', 'value': 2},
    {'source': 'Cochepaille', 'target': 'Bamatabois', 'value': 1},
    {'source': 'Pontmercy', 'target': 'Thenardier', 'value': 1},
    {'source': 'Boulatruelle', 'target': 'Thenardier', 'value': 1},
    {'source': 'Eponine', 'target': 'Mme.Thenardier', 'value': 2},
    {'source': 'Eponine', 'target': 'Thenardier', 'value': 3},
    {'source': 'Anzelma', 'target': 'Eponine', 'value': 2},
    {'source': 'Anzelma', 'target': 'Thenardier', 'value': 2},
    {'source': 'Anzelma', 'target': 'Mme.Thenardier', 'value': 1},
    {'source': 'Woman2', 'target': 'Valjean', 'value': 3},
    {'source': 'Woman2', 'target': 'Cosette', 'value': 1},
    {'source': 'Woman2', 'target': 'Javert', 'value': 1},
    {'source': 'MotherInnocent', 'target': 'Fauchelevent', 'value': 3},
    {'source': 'MotherInnocent', 'target': 'Valjean', 'value': 1},
    {'source': 'Gribier', 'target': 'Fauchelevent', 'value': 2},
    {'source': 'Mme.Burgon', 'target': 'Jondrette', 'value': 1},
    {'source': 'Gavroche', 'target': 'Mme.Burgon', 'value': 2},
    {'source': 'Gavroche', 'target': 'Thenardier', 'value': 1},
    {'source': 'Gavroche', 'target': 'Javert', 'value': 1},
    {'source': 'Gavroche', 'target': 'Valjean', 'value': 1},
    {'source': 'Gillenormand', 'target': 'Cosette', 'value': 3},
    {'source': 'Gillenormand', 'target': 'Valjean', 'value': 2},
    {'source': 'Magnon', 'target': 'Gillenormand', 'value': 1},
    {'source': 'Magnon', 'target': 'Mme.Thenardier', 'value': 1},
    {'source': 'Mlle.Gillenormand', 'target': 'Gillenormand', 'value': 9},
    {'source': 'Mlle.Gillenormand', 'target': 'Cosette', 'value': 2},
    {'source': 'Mlle.Gillenormand', 'target': 'Valjean', 'value': 2},
    {'source': 'Mme.Pontmercy', 'target': 'Mlle.Gillenormand', 'value': 1},
    {'source': 'Mme.Pontmercy', 'target': 'Pontmercy', 'value': 1},
    {'source': 'Mlle.Vaubois', 'target': 'Mlle.Gillenormand', 'value': 1},
    {'source': 'Lt.Gillenormand', 'target': 'Mlle.Gillenormand', 'value': 2},
    {'source': 'Lt.Gillenormand', 'target': 'Gillenormand', 'value': 1},
    {'source': 'Lt.Gillenormand', 'target': 'Cosette', 'value': 1},
    {'source': 'Marius', 'target': 'Mlle.Gillenormand', 'value': 6},
    {'source': 'Marius', 'target': 'Gillenormand', 'value': 12},
    {'source': 'Marius', 'target': 'Pontmercy', 'value': 1},
    {'source': 'Marius', 'target': 'Lt.Gillenormand', 'value': 1},
    {'source': 'Marius', 'target': 'Cosette', 'value': 21},
    {'source': 'Marius', 'target': 'Valjean', 'value': 19},
    {'source': 'Marius', 'target': 'Tholomyes', 'value': 1},
    {'source': 'Marius', 'target': 'Thenardier', 'value': 2},
    {'source': 'Marius', 'target': 'Eponine', 'value': 5},
    {'source': 'Marius', 'target': 'Gavroche', 'value': 4},
    {'source': 'BaronessT', 'target': 'Gillenormand', 'value': 1},
    {'source': 'BaronessT', 'target': 'Marius', 'value': 1},
    {'source': 'Mabeuf', 'target': 'Marius', 'value': 1},
    {'source': 'Mabeuf', 'target': 'Eponine', 'value': 1},
    {'source': 'Mabeuf', 'target': 'Gavroche', 'value': 1},
    {'source': 'Enjolras', 'target': 'Marius', 'value': 7},
    {'source': 'Enjolras', 'target': 'Gavroche', 'value': 7},
    {'source': 'Enjolras', 'target': 'Javert', 'value': 6},
    {'source': 'Enjolras', 'target': 'Mabeuf', 'value': 1},
    {'source': 'Enjolras', 'target': 'Valjean', 'value': 4},
    {'source': 'Combeferre', 'target': 'Enjolras', 'value': 15},
    {'source': 'Combeferre', 'target': 'Marius', 'value': 5},
    {'source': 'Combeferre', 'target': 'Gavroche', 'value': 6},
    {'source': 'Combeferre', 'target': 'Mabeuf', 'value': 2},
    {'source': 'Prouvaire', 'target': 'Gavroche', 'value': 1},
    {'source': 'Prouvaire', 'target': 'Enjolras', 'value': 4},
    {'source': 'Prouvaire', 'target': 'Combeferre', 'value': 2},
    {'source': 'Feuilly', 'target': 'Gavroche', 'value': 2},
    {'source': 'Feuilly', 'target': 'Enjolras', 'value': 6},
    {'source': 'Feuilly', 'target': 'Prouvaire', 'value': 2},
    {'source': 'Feuilly', 'target': 'Combeferre', 'value': 5},
    {'source': 'Feuilly', 'target': 'Mabeuf', 'value': 1},
    {'source': 'Feuilly', 'target': 'Marius', 'value': 1},
    {'source': 'Courfeyrac', 'target': 'Marius', 'value': 9},
    {'source': 'Courfeyrac', 'target': 'Enjolras', 'value': 17},
    {'source': 'Courfeyrac', 'target': 'Combeferre', 'value': 13},
    {'source': 'Courfeyrac', 'target': 'Gavroche', 'value': 7},
    {'source': 'Courfeyrac', 'target': 'Mabeuf', 'value': 2},
    {'source': 'Courfeyrac', 'target': 'Eponine', 'value': 1},
    {'source': 'Courfeyrac', 'target': 'Feuilly', 'value': 6},
    {'source': 'Courfeyrac', 'target': 'Prouvaire', 'value': 3},
    {'source': 'Bahorel', 'target': 'Combeferre', 'value': 5},
    {'source': 'Bahorel', 'target': 'Gavroche', 'value': 5},
    {'source': 'Bahorel', 'target': 'Courfeyrac', 'value': 6},
    {'source': 'Bahorel', 'target': 'Mabeuf', 'value': 2},
    {'source': 'Bahorel', 'target': 'Enjolras', 'value': 4},
    {'source': 'Bahorel', 'target': 'Feuilly', 'value': 3},
    {'source': 'Bahorel', 'target': 'Prouvaire', 'value': 2},
    {'source': 'Bahorel', 'target': 'Marius', 'value': 1},
    {'source': 'Bossuet', 'target': 'Marius', 'value': 5},
    {'source': 'Bossuet', 'target': 'Courfeyrac', 'value': 12},
    {'source': 'Bossuet', 'target': 'Gavroche', 'value': 5},
    {'source': 'Bossuet', 'target': 'Bahorel', 'value': 4},
    {'source': 'Bossuet', 'target': 'Enjolras', 'value': 10},
    {'source': 'Bossuet', 'target': 'Feuilly', 'value': 6},
    {'source': 'Bossuet', 'target': 'Prouvaire', 'value': 2},
    {'source': 'Bossuet', 'target': 'Combeferre', 'value': 9},
    {'source': 'Bossuet', 'target': 'Mabeuf', 'value': 1},
    {'source': 'Bossuet', 'target': 'Valjean', 'value': 1},
    {'source': 'Joly', 'target': 'Bahorel', 'value': 5},
    {'source': 'Joly', 'target': 'Bossuet', 'value': 7},
    {'source': 'Joly', 'target': 'Gavroche', 'value': 3},
    {'source': 'Joly', 'target': 'Courfeyrac', 'value': 5},
    {'source': 'Joly', 'target': 'Enjolras', 'value': 5},
    {'source': 'Joly', 'target': 'Feuilly', 'value': 5},
    {'source': 'Joly', 'target': 'Prouvaire', 'value': 2},
    {'source': 'Joly', 'target': 'Combeferre', 'value': 5},
    {'source': 'Joly', 'target': 'Mabeuf', 'value': 1},
    {'source': 'Joly', 'target': 'Marius', 'value': 2},
    {'source': 'Grantaire', 'target': 'Bossuet', 'value': 3},
    {'source': 'Grantaire', 'target': 'Enjolras', 'value': 3},
    {'source': 'Grantaire', 'target': 'Combeferre', 'value': 1},
    {'source': 'Grantaire', 'target': 'Courfeyrac', 'value': 2},
    {'source': 'Grantaire', 'target': 'Joly', 'value': 2},
    {'source': 'Grantaire', 'target': 'Gavroche', 'value': 1},
    {'source': 'Grantaire', 'target': 'Bahorel', 'value': 1},
    {'source': 'Grantaire', 'target': 'Feuilly', 'value': 1},
    {'source': 'Grantaire', 'target': 'Prouvaire', 'value': 1},
    {'source': 'MotherPlutarch', 'target': 'Mabeuf', 'value': 3},
    {'source': 'Gueulemer', 'target': 'Thenardier', 'value': 5},
    {'source': 'Gueulemer', 'target': 'Valjean', 'value': 1},
    {'source': 'Gueulemer', 'target': 'Mme.Thenardier', 'value': 1},
    {'source': 'Gueulemer', 'target': 'Javert', 'value': 1},
    {'source': 'Gueulemer', 'target': 'Gavroche', 'value': 1},
    {'source': 'Gueulemer', 'target': 'Eponine', 'value': 1},
    {'source': 'Babet', 'target': 'Thenardier', 'value': 6},
    {'source': 'Babet', 'target': 'Gueulemer', 'value': 6},
    {'source': 'Babet', 'target': 'Valjean', 'value': 1},
    {'source': 'Babet', 'target': 'Mme.Thenardier', 'value': 1},
    {'source': 'Babet', 'target': 'Javert', 'value': 2},
    {'source': 'Babet', 'target': 'Gavroche', 'value': 1},
    {'source': 'Babet', 'target': 'Eponine', 'value': 1},
    {'source': 'Claquesous', 'target': 'Thenardier', 'value': 4},
    {'source': 'Claquesous', 'target': 'Babet', 'value': 4},
    {'source': 'Claquesous', 'target': 'Gueulemer', 'value': 4},
    {'source': 'Claquesous', 'target': 'Valjean', 'value': 1},
    {'source': 'Claquesous', 'target': 'Mme.Thenardier', 'value': 1},
    {'source': 'Claquesous', 'target': 'Javert', 'value': 1},
    {'source': 'Claquesous', 'target': 'Eponine', 'value': 1},
    {'source': 'Claquesous', 'target': 'Enjolras', 'value': 1},
    {'source': 'Montparnasse', 'target': 'Javert', 'value': 1},
    {'source': 'Montparnasse', 'target': 'Babet', 'value': 2},
    {'source': 'Montparnasse', 'target': 'Gueulemer', 'value': 2},
    {'source': 'Montparnasse', 'target': 'Claquesous', 'value': 2},
    {'source': 'Montparnasse', 'target': 'Valjean', 'value': 1},
    {'source': 'Montparnasse', 'target': 'Gavroche', 'value': 1},
    {'source': 'Montparnasse', 'target': 'Eponine', 'value': 1},
    {'source': 'Montparnasse', 'target': 'Thenardier', 'value': 1},
    {'source': 'Toussaint', 'target': 'Cosette', 'value': 2},
    {'source': 'Toussaint', 'target': 'Javert', 'value': 1},
    {'source': 'Toussaint', 'target': 'Valjean', 'value': 1},
    {'source': 'Child1', 'target': 'Gavroche', 'value': 2},
    {'source': 'Child2', 'target': 'Gavroche', 'value': 2},
    {'source': 'Child2', 'target': 'Child1', 'value': 3},
    {'source': 'Brujon', 'target': 'Babet', 'value': 3},
    {'source': 'Brujon', 'target': 'Gueulemer', 'value': 3},
    {'source': 'Brujon', 'target': 'Thenardier', 'value': 3},
    {'source': 'Brujon', 'target': 'Gavroche', 'value': 1},
    {'source': 'Brujon', 'target': 'Eponine', 'value': 1},
    {'source': 'Brujon', 'target': 'Claquesous', 'value': 1},
    {'source': 'Brujon', 'target': 'Montparnasse', 'value': 1},
    {'source': 'Mme.Hucheloup', 'target': 'Bossuet', 'value': 1},
    {'source': 'Mme.Hucheloup', 'target': 'Joly', 'value': 1},
    {'source': 'Mme.Hucheloup', 'target': 'Grantaire', 'value': 1},
    {'source': 'Mme.Hucheloup', 'target': 'Bahorel', 'value': 1},
    {'source': 'Mme.Hucheloup', 'target': 'Courfeyrac', 'value': 1},
    {'source': 'Mme.Hucheloup', 'target': 'Gavroche', 'value': 1},
    {'source': 'Mme.Hucheloup', 'target': 'Enjolras', 'value': 1}
  ]
}
const SetNumOfNodes = 100;
class Graph extends Component {
  constructor(props) {
    super(props);
    this.state = props;
  }
  componentDidMount() {
    console.log('componentDidMount');
  }
  componentDidUpdate() {
    this.drawwithlabels();
    console.log('componentDidUpdate');
  }

  drawwithlabels(){
    console.log(this.props);
    let props = this.props.visprops;
    let set={'nodes': [], 'links': []};
    let link, node, links, nodes;

    let removeWords=['新聞','八卦','幹嘛']
    let keys = Object.keys(props);

    //Nodes setting
    for(let i=0;i<Math.min(props.length,SetNumOfNodes);i++){
      if(props[i][0] != null){
        let existKey = set.nodes.find(function(ele){
          return ele.id === props[i][0];
        })
        if(existKey === undefined){
          if(!removeWords.includes(props[i][0])){
            set.nodes.push({id: props[i][0], articleIndex:props[i][2], group: 1, tag: 0, size: 5+Math.log2(props[i][1].length)});
            props[i][1].forEach(function(id){
              let existId = set.nodes.find(function(ele){
                return ele.id === id;
              })
              if(existId === undefined){
                if(id != null)
                  set.nodes.push({id: id, group: 2, tag: 0, size: 5});
              }
            })
          }
        }
      }      
    }

    //title words links by articleIndex
    let groupedWords = [];
    for(let i=0;i<Math.min(props.length,SetNumOfNodes);i++){
      if(props[i][0] != null){
        props[i][1].forEach(function(id){
          if(id != null){
            let existLink = set.links.find(function(ele){
              return ele.source === id && ele.target === props[i][0];
            })
            if(existLink === undefined){
                if(!removeWords.includes(props[i][0])){
                  set.links.push({source: id,target:props[i][0], tag: 0, value: 1});
                }
            }else{
              existLink.value++;
              //console.log(existLink);
            }
          }
        })
      }
    }

    //Links setting
    for(let i=0;i<Math.min(props.length,SetNumOfNodes);i++){
      if(props[i][0] != null){
        props[i][1].forEach(function(id){
          if(id != null){
            let existLink = set.links.find(function(ele){
              return ele.source === id && ele.target === props[i][0];
            })
            if(existLink === undefined){
                if(!removeWords.includes(props[i][0])){
                  set.links.push({source: id,target:props[i][0], tag: 0, value: 1});
                }
            }else{
              existLink.value++;
              //console.log(existLink);
            }
          }
        })
      }
    }

    const width=900,height=700;
    var svg = d3.select(this.refs.chart)
      .select('svg');
      
    svg.selectAll('*').remove();
    
    svg = svg.call(d3.zoom().scaleExtent([1 / 2, 8]).on('zoom', zoomed))
        .append('g')
        .attr('transform', 'translate(40,0)');
    
    function zoomed() {
      svg.attr('transform', d3.event.transform);
    } 

    var color = d3.scaleOrdinal(d3.schemeCategory10 );
    color(1);
    var simulation = d3.forceSimulation()
        .force('link', d3.forceLink().id(function(d) { return d.id; }))
        .force('charge', d3.forceManyBody().strength(-30))
        .force('center', d3.forceCenter(width / 2, height / 2));

    update();
    
    function update(){
      
      // console.log(set);
      
      nodes = set.nodes;
      links = set.links;
            
      //  var g =svg.append('g')
      //     .attr('class', 'everything')

      var link = svg.selectAll('line')
                    .data(set.links);
      link.exit().remove();
      
      let linkEnter = link.enter()
          .append('line')
          .attr('class', 'links')
          .attr('stroke','#999')
          .attr('stroke-width', function(d) { return Math.sqrt(d.value); });
      
      link = linkEnter.merge(link)
      var node = svg.selectAll('g')
                    .data(set.nodes);
      
      node.exit().remove();  
  
      let nodeEnter = node.enter()
        .append('g')
        .attr('class', 'nodes')
        .on('click', clicked)
        .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));
        //.on('mouseover', mouseOver(.2))
        //.on('mouseout', mouseOut);
    
      var circles = nodeEnter.append('circle')
        .attr('r', function(d){ return d.size; })
        .attr('fill', function(d) { return color(d.group); })
        .attr('stroke','white')
        .attr('stroke-width',0.9)
        .attr('stroke-opacity',1);
  
      // var zoom_handler = d3.zoom()
      //       .on('zoom', zoom_actions);
      // zoom_handler(svg);
      var lables = nodeEnter.append('text')
        .text(function(d) {
          return d.id;
        })
        .attr('font-family', 'sans-serif')
        .attr('font-size',' 10px')
        .attr('color','#000')
        .attr('visibility',function(d){
          if(d.group == 1)
            return 'visible';
          return 'hidden';
        })
        .attr('x', 0)
        .attr('y', 0);
      nodeEnter.append('title')
        .text(function(d) { return d.id; });
  
      node = nodeEnter.merge(node);
      simulation
            .nodes(set.nodes)
            .on('tick', ticked);

      simulation.force('link')
            .links(set.links)
            .distance(function(d){return 30/d.value});
    

      function ticked() {
        link
            .attr('x1', function(d) { return d.source.x; })
            .attr('y1', function(d) { return d.source.y; })
            .attr('x2', function(d) { return d.target.x; })
            .attr('y2', function(d) { return d.target.y; });
        node
            .attr('transform', function(d) {
              return 'translate(' + d.x + ',' + d.y + ')';
            })
        }

      function zoom_actions(){
        g.attr('transform', d3.event.transform);
      }

      function clicked(d, i) {
        //console.log('clicked');
        //console.log(d.tag);
        if (d3.event.defaultPrevented) return; // dragged
      
        if(d.tag==0){
          //console.log(d);
          //console.log(d.tag);        
            // check all other nodes to see if they're connected
            // to this one. if so, keep the opacity at 1, otherwise
            // fade
          node.selectAll('circles').style('stroke-opacity', function(o) {
            if(o.tag==0){
              if(isConnected(d,o)){
                //o.tag=1;
                return 1;
              }
              return 0.2;
            }
            return 1;
          });
          node.style('fill-opacity', function(o) {
            if(o.tag==0){  
              if(isConnected(d,o)){
                //o.tag=1;
                return 1;
              }
              return 0.2;
            }
            return 1;
          });
          node.selectAll('circle').style('fill',function(o){
            if(o.tag !=0){
              console.log(d,o);
              if(isConnected(d,o)){
                //o.tag++;
                if(o.group == 2)
                  return 'red';
              }
            }
            if(o.group==1)
              return '#1f77b4';
            return '#ff7f0e';
          })
          node.selectAll('text').style('visibility',function(o){
            if(o.tag==0){
              if(isConnected(d, o)){
                o.tag++;
                return 'visible';
              }
            }
          });
            // also style link accordingly
          link.style('stroke-opacity', function(o) {
            //console.log(o);
            if(o.tag==0){
              if(o.source === d || o.target === d){
                return 1;
              }
              return 0.2;
            }
            return 1;
          });
          link.style('stroke', function(o){
            if(o.tag==0){
              if(o.source === d || o.target === d){
                o.tag++;
                return o.source.colour;
              }
              return '#ddd';
            }
            return o.source.colour;
          });
          d.tag=1;
        }else{
          //console.log(d.tag);
          d.tag=0;
          mouseOut();
  
        }
        update();
        simulation.restart();
      }

      function mouseOut() {
        node.style('stroke-opacity', function(d){
          d.tag=0;
          return 1
        });
        node.style('fill-opacity', 1);
        node.selectAll('text').style('visibility',function(d){
          if(d.group == 1)
            return 'visible';
          return 'hidden';
        });
        node.selectAll('circle').style('fill',function(d){
          if(d.group ==2)
            return '#ff7f0e';
          return '1f77b4';
          });
        link.style('stroke-opacity', 1);
        link.style('stroke', function(d){
          d.tag=0;
          return '#ddd';
        });
      }
    }
    // build a dictionary of nodes that are linked
    var linkedByIndex = {};
    links.forEach(function(d) {
        linkedByIndex[d.source.index + ',' + d.target.index] = 1;
    });

    // check the dictionary to see if nodes are linked
    function isConnected(a, b) {
      //console.log(a,b);
      // if(b.tag==1){
      //   //console.log('tag==1');
      //   return true;
      // }
      return linkedByIndex[a.index + ',' + b.index] || linkedByIndex[b.index + ',' + a.index] || a.index == b.index;
    }

    // fade nodes on hover
    function mouseOver(opacity) {
        return function(d) {
            // check all other nodes to see if they're connected
            // to this one. if so, keep the opacity at 1, otherwise
            // fade
            node.selectAll('circles').style('stroke-opacity', function(o) {
              let thisOpacity = isConnected(d, o) ? 1 : opacity;
              return thisOpacity;
            });
            node.style('fill-opacity', function(o) {
              let thisOpacity = isConnected(d, o) ? 1 : opacity;
              return thisOpacity;
            });

            node.selectAll('text').style('visibility',function(o){
                
              if(isConnected(d, o) || o.tag != 0)
                return 'visible';
            });
            // also style link accordingly
            link.style('stroke-opacity', function(o) {
                return o.source === d || o.target === d ? 1 : opacity;
            });
            link.style('stroke', function(o){
                return o.source === d || o.target === d ? o.source.colour : '#ddd';
            });
        };
    }

    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  
  /*let set = {
      'name':'',
      'children':[{'name':'','size':1000}]
    }
    
    let removeWords=['新聞','八卦','幹嘛']
    let keys = Object.keys(props);

    //Nodes setting
    for(let i=0;i<Math.min(props.length,SetNumOfNodes);i++){
      if(props[i][0] != null){
          if(!removeWords.includes(props[i][0])){
            props[i][1].forEach(function(id){
              if(id != null)
                set['children'].push({name: props[i][0], children: [{name:id, group: 2, tag: 0, size: 1000}]});
            }) 
        }
      }      
    }
    console.log(set);

    let root = set;
    const width=900,height=700;
    var svg = d3.select(this.refs.chart)
      .select('svg');
    
    svg.selectAll('*').remove();

    var color = d3.scaleOrdinal(d3.schemeCategory10 );
    color(1);
    var force = d3.forceSimulation()
        .force('link', d3.forceLink().id(function(d) { return d.id; }))
        .force('charge', d3.forceManyBody().strength(-30))
        .force('center', d3.forceCenter(width / 2, height / 2));

    var link = svg.selectAll('.link'),
        node = svg.selectAll('.node');

    root = set;
    update();

    force.on('tick',tick);
    function update() {
      var hierarchy = d3.hierarchy(root);
      var tree = d3.tree();
      var links = tree(hierarchy).links();

      var nodes = flatten(root);
          //links = d3.tree().links(nodes);
      console.log(nodes);
      console.log(hierarchy);
      console.log(links);
      // Restart the force layout.
      force.nodes(nodes)
          .force('link', d3.forceLink(links).distance(70));

      // Update the links…
      link = link.data(links, function(d) { return d.target.id; });

      // Exit any old links.
      link.exit().remove();

      // Enter any new links.
      link.enter().insert('line', '.node')
          .attr('class', 'link')
          .attr('x1', function(d) { return d.source.x; })
          .attr('y1', function(d) { return d.source.y; })
          .attr('x2', function(d) { return d.target.x; })
          .attr('y2', function(d) { return d.target.y; });

      // Update the nodes…
      node = node.data(nodes, function(d) { return d.id; }).style('fill', color);

      // Exit any old nodes.
      node.exit().remove();

      // Enter any new nodes.
      node.enter().append('circle')
          .attr('class', 'node')
          .attr('cx', function(d) { return d.x; })
          .attr('cy', function(d) { return d.y; })
          .attr('r', function(d) { return Math.sqrt(d.size) / 10 || 4.5; })
          .style('fill', color)
          .on('click', click);
          //.call(force.drag);
    }

    function tick() {
      link.attr('x1', function(d) { return d.source.x; })
          .attr('y1', function(d) { return d.source.y; })
          .attr('x2', function(d) { return d.target.x; })
          .attr('y2', function(d) { return d.target.y; });

      node.attr('transform', function(d) {
            return 'translate(' + d.x + ',' + d.y + ')';
          })
    }

    // Color leaf nodes orange, and packages white or blue.
    function color(d) {
      return d._children ? '#3182bd' : d.children ? '#c6dbef' : '#fd8d3c';
    }

    // Toggle children on click.
    function click(d) {
      if (!d3.event.defaultPrevented) {
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
        update();
      }
    }

    // Returns a list of all nodes under the root.
    function flatten(root) {
      var nodes = [], i = 0;

      function recurse(node) {
        if (node.children) node.children.forEach(recurse);
        if (!node.id) node.id = ++i;
        nodes.push(node);
      }

      recurse(root);
      return nodes;
    }*/
    
  
  
  
  }
  
 
  render(){
    return <div id={'#' + this.props.id}>
      <div ref='chart'><svg width='100%' height='700px'></svg></div>
    </div>
  }
}



export default Graph;
