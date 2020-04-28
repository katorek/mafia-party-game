export const data = [
  {
    key: 'role', data: [
      {name: 'mafia', desc: 'Jego celem jest wyeliminować wszystkich obywateli, w tym policjantów, lekarzy.', show: 'Mafia'},
      {name: 'citizen', desc: 'Normalny szarak, jego celem wyeliminować całą Mafię poprzez głosowanie.', show: 'Obywatel'},
      {
        name: 'detective',
        desc: 'Podobnie jak obywatel. Dodatkowo podczas nocy może sprawdzić danego gracza by sprawdzic czy jest on z Mafii.',
        show: 'Policjant'
      },
      {
        name: 'doctor',
        desc: 'Podobnie jak obywatel. Dodatkowo podczas fazy nocy może nałożyć ochronę na danego gracza przed Mafią.',
        show: 'Lekarz'
      },
      {name: 'terrorist', desc: '', show: 'Terrorysta'}
    ]
  },
  {
    key: 'action', data: [
      {name: 'magik', desc: '', show: 'Magik'},
      {name: 'pojedynek', desc: '', show: 'Pojedynek'},
      {name: 'julia', desc: '', show: 'Julia'},
      {name: 'romeo', desc: '', show: 'Romeo'},
      {name: 'pozar', desc: '', show: 'Pozar'},
      {name: 'niewaznyglos', desc: '', show: 'Niewaznyglos'},
      {name: 'kamizelka', desc: '', show: 'Kamizelka'},
      {name: 'burmistrz', desc: '', show: 'Burmistrz'},
      {name: 'pistolet', desc: '', show: 'Pistolet'},
      {name: 'sedzia', desc: '', show: 'Sedzia'},
      {name: 'jezus', desc: '', show: 'Jezus'}
    ]
  },
  {
    key: 'phase', data: [
      {name: 'night', desc: 'Faza mafii, policjanta oraz lekarza', show: 'Noc'},
      {name: 'day', desc: 'Faza głosowania przez wszystkich graczy', show: 'Dzień'},
    ]
  }
];
