import { DEFECT_TYPES } from '../../../utils/constants';

interface Props {
    selected: string[];
    onToggle: (defect: string) => void;
}

export function DefectTags({ selected, onToggle }: Props) {
    return (
        <div className="flex flex-wrap gap-2">
            {DEFECT_TYPES.map(defect => {
                const active = selected.includes(defect);
                return (
                    <button
                        key={defect}
                        type="button"
                        onClick={() => onToggle(defect)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase border transition
              ${active
                                ? 'bg-black text-white border-black'
                                : 'bg-gray-100 text-gray-600 border-gray-200 hover:border-gray-400'
                            }`}
                    >
                        {defect}
                    </button>
                );
            })}
        </div>
    );
}
