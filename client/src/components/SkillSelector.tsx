import { useQuery } from '@tanstack/react-query'
import { skillsApi } from '../lib/api'
import { Check } from 'lucide-react'

interface SkillSelectorProps {
    selectedIds: string[]
    onChange: (ids: string[]) => void
    maxSelections?: number
}

export function SkillSelector({ selectedIds, onChange, maxSelections }: SkillSelectorProps) {
    const { data, isLoading } = useQuery({
        queryKey: ['skills'],
        queryFn: () => skillsApi.list(),
    })

    const skills = data?.data?.data?.skills || []
    const grouped = data?.data?.data?.grouped || {}

    const toggleSkill = (skillId: string) => {
        if (selectedIds.includes(skillId)) {
            onChange(selectedIds.filter(id => id !== skillId))
        } else {
            if (maxSelections && selectedIds.length >= maxSelections) {
                return
            }
            onChange([...selectedIds, skillId])
        }
    }

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded-lg" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {Object.entries(grouped).map(([category, categorySkills]) => (
                <div key={category}>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                        {category}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {(categorySkills as any[]).map((skill) => {
                            const isSelected = selectedIds.includes(skill.id)
                            return (
                                <button
                                    key={skill.id}
                                    type="button"
                                    onClick={() => toggleSkill(skill.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${isSelected
                                            ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                                            : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'}`}
                                >
                                    {isSelected && <Check className="w-3.5 h-3.5" />}
                                    {skill.name}
                                </button>
                            )
                        })}
                    </div>
                </div>
            ))}

            {maxSelections && (
                <p className="text-sm text-gray-500">
                    {selectedIds.length}/{maxSelections} selected
                </p>
            )}
        </div>
    )
}
