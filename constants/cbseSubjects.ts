export type CbseTopic = string;

export type CbseSubject = {
  name: string;
  topics: CbseTopic[];
};

export type CbseClassEntry = {
  class: number; // 1..10
  subjects: CbseSubject[];
};

export const CBSE_DATA: CbseClassEntry[] = [
  {
    class: 1,
    subjects: [
      {
        name: "English",
        topics: ["Alphabet", "Phonics", "Basic Words", "Simple Sentences", "Rhymes", "Picture Reading"],
      },
      {
        name: "Mathematics",
        topics: ["Counting Numbers", "Addition", "Subtraction", "Shapes", "Time", "Money"],
      },
      {
        name: "EVS",
        topics: ["Myself", "Family", "Plants", "Animals", "Food", "Seasons"],
      },
    ],
  },
  {
    class: 2,
    subjects: [
      { name: "English", topics: ["Reading", "Short Stories", "Nouns", "Verbs", "Rhymes"] },
      { name: "Mathematics", topics: ["Numbers 1-200", "Addition", "Subtraction", "Shapes", "Measurement"] },
      { name: "EVS", topics: ["Family", "Food", "Water", "Plants", "Animals"] },
    ],
  },
  {
    class: 3,
    subjects: [
      { name: "English", topics: ["Grammar Basics", "Sentence Formation", "Reading Comprehension", "Story Writing"] },
      { name: "Mathematics", topics: ["Multiplication", "Division", "Fractions", "Geometry Basics", "Time"] },
      { name: "EVS", topics: ["Plants", "Animals", "Human Body", "Transport", "Water"] },
    ],
  },
  {
    class: 4,
    subjects: [
      { name: "English", topics: ["Grammar", "Paragraph Writing", "Reading Skills"] },
      { name: "Mathematics", topics: ["Large Numbers", "Factors", "Multiples", "Fractions", "Area"] },
      { name: "EVS", topics: ["Environment", "Natural Resources", "Animals", "Community"] },
    ],
  },
  {
    class: 5,
    subjects: [
      { name: "English", topics: ["Reading", "Writing", "Grammar", "Story Writing"] },
      { name: "Mathematics", topics: ["Decimals", "Fractions", "Geometry", "Measurement"] },
      { name: "EVS", topics: ["Food", "Shelter", "Travel", "Water", "Environment"] },
    ],
  },
  {
    class: 6,
    subjects: [
      {
        name: "Science",
        topics: ["Food and Nutrition", "Fibre to Fabric", "Sorting Materials", "Motion", "Light", "Electricity"],
      },
      { name: "Mathematics", topics: ["Integers", "Fractions", "Ratio", "Geometry", "Data Handling"] },
      { name: "Social Science", topics: ["Ancient Civilizations", "Maps", "Government", "Culture"] },
    ],
  },
  {
    class: 7,
    subjects: [
      { name: "Science", topics: ["Nutrition in Plants", "Heat", "Acids and Bases", "Electric Current"] },
      { name: "Mathematics", topics: ["Algebra", "Ratio and Proportion", "Perimeter", "Statistics"] },
      { name: "Social Science", topics: ["Medieval History", "Resources", "Democracy"] },
    ],
  },
  {
    class: 8,
    subjects: [
      { name: "Science", topics: ["Crop Production", "Microorganisms", "Force", "Sound", "Light"] },
      { name: "Mathematics", topics: ["Linear Equations", "Quadrilaterals", "Mensuration", "Probability"] },
      { name: "Social Science", topics: ["Colonialism", "Industries", "Indian Constitution"] },
    ],
  },
  {
    class: 9,
    subjects: [
      { name: "Science", topics: ["Matter", "Atoms and Molecules", "Motion", "Force", "Cell Structure"] },
      { name: "Mathematics", topics: ["Number Systems", "Polynomials", "Triangles", "Statistics"] },
      { name: "Social Science", topics: ["French Revolution", "Climate", "Democracy", "Economics"] },
    ],
  },
  {
    class: 10,
    subjects: [
      { name: "Science", topics: ["Chemical Reactions", "Electricity", "Magnetism", "Heredity", "Environment"] },
      { name: "Mathematics", topics: ["Quadratic Equations", "Trigonometry", "Circles", "Probability"] },
      { name: "Social Science", topics: ["Nationalism in India", "Agriculture", "Political Parties", "Globalization"] },
    ],
  },
];