import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { DayPicker } from "react-day-picker";
import 'react-day-picker/style.css'

import './DatePicker.css'

type DatePickerProps = {
    value: string
    onChange: (value: string) => void
    id?: string
    placeholder?: string
    disabled?: boolean
}

function parseDate(value: string): Date | undefined {
    if(!value) return undefined

    const [year, month, day] = value.split('-').map(Number)

    if (!year || !month || !day) return undefined

    return new Date(year, month - 1, day)
}

function formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

function formatDisplayDate(value: string): string {
    const date = parseDate(value)

    if (!date) return ''

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date)
}

export default function DatePicker({
    value,
    onChange,
    id,
    placeholder = 'Pick a date',
    disabled = false,
}: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const selectedDate = parseDate(value)

    useEffect(() => {
        function handlePointerDown(event: PointerEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') setIsOpen(false)
        }

        document.addEventListener('pointerdown', handlePointerDown)
        document.addEventListener('keydown', handleKeyDown)
        
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [])

    function selectToday() {
        onChange(formatDate(new Date()))
        setIsOpen(false)
    }

    return (
        <div className="date-picker" ref={containerRef}>
            <button
                id={id}
                type="button"
                className={`date-picker-trigger${value ? ' has-value' : ''}`}
                aria-haspopup='dialog'
                aria-expanded={isOpen}
                disabled={disabled}
                onClick={() => setIsOpen((current) => !current)}
            >
                <CalendarDays size={18} aria-hidden='true' />
                <span>
                    {value ? formatDisplayDate(value) : placeholder}
                </span>
            </button>

            {isOpen && (
                <div
                    className="date-picker-popover"
                    role="dialog"
                    aria-label="Choose a due date"
                >
                    <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                            if (date) {
                                onChange(formatDate(date))
                                setIsOpen(false)
                            }
                        }}
                        defaultMonth={selectedDate ?? new Date()}
                        weekStartsOn={1}
                        showOutsideDays
                    />

                    <div className="date-picker-footer">
                        <button
                            type="button"
                            className="date-picker-text-button"
                            onClick={() => {
                                onChange('')
                                setIsOpen(false)
                            }}
                        >
                            Clear date
                        </button>

                        <button
                            type="button"
                            className="date-picker-today-button"
                            onClick={selectToday}
                        >
                            Today
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}