/**
 * Returns a function that invokes passed function only when specified period of time has passes since last
 * call of returned function.
 *
 * @param func Function to call when specified period of time since last call passed.
 * @param wait Number of milliseconds to wait before invoking passed function.
 */
export function debounce<T extends (...args: any[]) => void>(func: T, wait?: number): T {
    let timer: number | undefined;

    return function (...args) {
        window.clearTimeout(timer);

        timer = window.setTimeout(() => {
            timer = undefined;

            func(...args);
        }, wait);
    } as T;
}
