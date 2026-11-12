/**
 * Short texts for the city pages, written for this site (not API data).
 * Places and streets only: no prices, no market figures. A city without a
 * text gets a page with its listings alone.
 */
export const CITY_TEXT: Record<string, { lede: string; body: string[] }> = {
  lyon: {
    lede: "De la Presqu'île aux pentes de la Croix-Rousse, nos deux agences lyonnaises vendent et louent surtout de l'ancien.",
    body: [
      "Entre Bellecour et Ainay, les immeubles en pierre de taille ont de grands appartements traversants, souvent avec moulures, parquet et cheminées. Les Brotteaux et le 6e offrent le même type de biens, plus près du parc de la Tête d'Or.",
      "Sur le plateau et les pentes de la Croix-Rousse, ce sont des appartements de canuts : hauteur sous plafond, poutres, mezzanines. Le Vieux Lyon et Vaise complètent le secteur de l'agence du boulevard.",
    ],
  },
  bordeaux: {
    lede: 'Aux Chartrons et à Caudéran, nos deux agences bordelaises connaissent la pierre blonde, rue par rue.',
    body: [
      "Dans le centre, des appartements en étage dans des immeubles XVIIIe et XIXe, des Chartrons à Saint-Michel. Côté Bastide et Bacalan, des biens plus récents, souvent avec terrasse.",
      "À Caudéran, les échoppes de plain-pied et les maisons avec jardin sont l'essentiel de ce que nous vendons, à quelques minutes du parc Bordelais.",
    ],
  },
  villeurbanne: {
    lede: "Villeurbanne est suivie par notre agence de la Presqu'île, à vingt minutes en métro.",
    body: [
      "Autour des Gratte-Ciel, les immeubles des années 1930 ont des appartements bien distribués avec balcon. Vers Charpennes et Grandclément, on trouve davantage de résidences récentes avec parking.",
    ],
  },
  'caluire-et-cuire': {
    lede: "Caluire-et-Cuire, au nord de la Croix-Rousse, est suivie par notre agence du boulevard.",
    body: ["Maisons avec jardin vers Montessuy, appartements en résidence près de la place Foch et quelques belles maisons sur les bords de Saône."],
  },
  pessac: {
    lede: 'Pessac est suivie par notre agence de Caudéran.',
    body: ['Maisons individuelles avec jardin dans les quartiers résidentiels, appartements près du tram et du campus.'],
  },
  merignac: {
    lede: 'Mérignac est suivie par notre agence de Caudéran.',
    body: ['Surtout des maisons avec jardin, du centre-ville à Arlac, et des appartements récents le long du tram A.'],
  },
};
