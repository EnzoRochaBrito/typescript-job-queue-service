export class DateUtils {
    /**
     * Return the date from now + the days passed
     * @param days 
     */
    static dateInNDays(days: number): Date {
        const date = new Date()
        date.setDate(date.getDate() + days)
        return date
    }
}