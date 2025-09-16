const API_BASE_URL = 'https://literally-fair-lark.cloudpub.ru'

export interface CourseItem {
    id: number
    title: string
    image_url: string
    screen: string
    type: 'course' | 'test'
    order_index: number
}

export const apiService = {
    async getCourses():Promise<CourseItem[]> {
        const response = await fetch(`${API_BASE_URL}/api/courses`)
        const data = await response.json()
        return data
    },
    async getTests():Promise<CourseItem[]> {
        const response = await fetch(`${API_BASE_URL}/api/tests`)
        const data = await response.json()
        return data
    },
    async getAllContent():Promise<{courses: CourseItem[]; tests: CourseItem[]}>{
        const [courses, tests] = await Promise.all([
            this.getCourses(),
            this.getTests()
        ])
        return {courses, tests}
    }
}
