export type StateBoard = "AP" | "Telangana";

export type StateSubject = {
  name: string;
  topics: string[];
};

type StateClassSubjects = {
  class: number;
  subjects: StateSubject[];
};

export const STATE_DATA: Record<StateBoard, StateClassSubjects[]> = {
  AP: [
    {
      class: 1,
      subjects: [
        {
          name: "Mathematics",
          topics: ["Numbers", "Addition & Subtraction", "Shapes"],
        },
        {
          name: "English",
          topics: ["Phonics", "Simple words", "Stories"],
        },
      ],
    },
  ],
  Telangana: [
    {
      class: 1,
      subjects: [
        {
          name: "Mathematics",
          topics: ["Counting", "Patterns", "Shapes"],
        },
        {
          name: "EVS",
          topics: ["My Family", "Our School", "Plants & Animals"],
        },
      ],
    },
  ],
};


