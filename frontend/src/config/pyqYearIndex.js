// PYQ Year-wise PDF Index
// Maps each GATE year to its question paper PDF and answer key PDF.
// Add your PDF filenames here after placing files in /public/pyq/

const YEARLY_PYQS = [
  { year: 2026, paper: '', answerKey: '' },
  { year: 2025, paper: '', answerKey: '/pyq/GATE-CS-2025-Set-1-Answer-Key.pdf' },
  { year: 2024, paper: '/pyq/CS124S5.pdf', answerKey: '' },
  { year: 2023, paper: '/pyq/GATE-20231.pdf', answerKey: '' },
  { year: 2022, paper: '/pyq/GATE-2022-part-1.pdf', answerKey: '' },
  { year: 2021, paper: '/pyq/GATE2021_QP_CS-1.pdf', answerKey: '' },
  { year: 2020, paper: '', answerKey: '' },
  { year: 2019, paper: '', answerKey: '' },
  { year: 2018, paper: '', answerKey: '' },
  { year: 2017, paper: '', answerKey: '' },
  { year: 2016, paper: '', answerKey: '' },
  { year: 2015, paper: '', answerKey: '' },
  { year: 2014, paper: '', answerKey: '' },
  { year: 2013, paper: '', answerKey: '' },
  { year: 2012, paper: '', answerKey: '' },
  { year: 2011, paper: '', answerKey: '' },
  { year: 2010, paper: '', answerKey: '' },
  { year: 2009, paper: '', answerKey: '' },
  { year: 2008, paper: '', answerKey: '' },
  { year: 2007, paper: '', answerKey: '' },
  { year: 2006, paper: '', answerKey: '' },
  { year: 2005, paper: '', answerKey: '' },
  { year: 2004, paper: '', answerKey: '' },
  { year: 2003, paper: '', answerKey: '' },
  { year: 2002, paper: '', answerKey: '' },
  { year: 2001, paper: '', answerKey: '' },
  { year: 2000, paper: '', answerKey: '' },
].filter(y => y.paper || y.answerKey || y.year >= 2024);

// Master compilation (all years in one PDF, subject-split)
const MASTER_PDF = '/pyq/gate-cse-pyq-2000-2026.pdf';

export { YEARLY_PYQS, MASTER_PDF };
