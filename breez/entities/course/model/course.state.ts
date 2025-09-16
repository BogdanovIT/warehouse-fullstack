import { atom } from "jotai";
import { apiService, CourseItem } from "@/services/api";

export const coursesAtom = atom<CourseItem[]>([])
export const testsAtom = atom<CourseItem[]>([])
export const isLoadingAtom = atom<boolean>(true)
export const errorAtom = atom<string | null>(null)
export const loadContentAtom = atom(
    null,
    async (get, set) => {
        set(isLoadingAtom, true)
        set(errorAtom, null)
        try {
            const { courses, tests } = await apiService.getAllContent()
            set(coursesAtom, courses)
            set(testsAtom, tests)
        } catch(error) {
            set(errorAtom, 'Ошибка при загрузке контента')
        } finally {
            set(isLoadingAtom, false)
        }
    }
)