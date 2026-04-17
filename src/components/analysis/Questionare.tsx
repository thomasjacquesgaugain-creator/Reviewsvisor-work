import React, { useState } from "react";
import { Button } from "../ui/button";

type Props = {
  problemTitle: string;
};

const OPTIONS = [
  { label: "No", value: 0, icon: "❌" },
  { label: "Unlikely", value: 1, icon: "⚠️" },
  { label: "Uncertain", value: 2, icon: "🤔" },
  { label: "Likely", value: 3, icon: "☑️" },
  { label: "Very likely", value: 4, icon: "🔥" },
];

const Section = ({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  value: number | null;
  onChange: (val: number) => void;
}) => {
  return (
    <div className="border-b border-gray-300 p-3">
      <div className="font-semibold">{title}</div>
      <div className="mb-2 text-sm text-gray-700">{subtitle}</div>

      <div className="flex justify-between space-between gap-3 border rounded-full px-3 py-2 w-full  ">
        {OPTIONS.map((opt) => {
          const selected = value === opt.value;

          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full transition 
                ${
                  selected
                    ? "bg-blue-100 border border-blue-400"
                    : "hover:bg-gray-100"
                }`}
            >
              <span>{opt.icon}</span>
              <span className="text-sm">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Questionare = ({ problemTitle }: Props) => {
  const [scores, setScores] = useState({
    manpower: null as number | null,
    method: null as number | null,
    machine: null as number | null,
    material: null as number | null,
    measurement: null as number | null,
  });

  return (
    <div className="border border-gray-400 rounded w-full font-sans">
      {/* Header */}
      <div className="text-center font-bold p-3 border-b bg-gray-100">
        {problemTitle}
      </div>

      {/* Sections */}
      <Section
        title="Manpower : (People)"
        subtitle="Is the issue related to staff skills or training?"
        value={scores.manpower}
        onChange={(val) =>
          setScores({ ...scores, manpower: val })
        }
      />

      <Section
        title="Method : (Processes)"
        subtitle="Is the issue related to the way tasks are performed or to a lack of clear procedures?"
        value={scores.method}
        onChange={(val) =>
          setScores({ ...scores, method: val })
        }
      />

      <Section
        title="Machine : (Equipments - Tools)"
        subtitle="Is the issue related to tools, equipment, or software used?"
        value={scores.machine}
        onChange={(val) =>
          setScores({ ...scores, machine: val })
        }
      />

      <Section
        title="Material : (Products)"
        subtitle="Is the issue related to the quality of the products used?"
        value={scores.material}
        onChange={(val) =>
          setScores({ ...scores, material: val })
        }
      />

      <Section
        title="Measurement : (Environnement - Context)"
        subtitle="Is the issue related to the environment or external conditions (customer type, constraints, context)?"
        value={scores.measurement}
        onChange={(val) =>
          setScores({ ...scores, measurement: val })
        }
     />
     <Button>Submit</Button>
</div>
  );
};

export default Questionare;