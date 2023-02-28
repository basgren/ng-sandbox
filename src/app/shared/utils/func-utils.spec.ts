import {debounce} from './func-utils';

describe('debounce()', () => {
    let subject: jasmine.Spy;
    let debouncedFn: Function;

    beforeEach(() => {
        jasmine.clock().install();

        subject = jasmine.createSpy('debounceCallback');
        debouncedFn = debounce(subject, 1000);
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    it('invokes function only after specified period', () => {
        debouncedFn();

        jasmine.clock().tick(999);
        expect(subject).not.toHaveBeenCalled();
        jasmine.clock().tick(1);
        expect(subject).toHaveBeenCalled();
    });

    it('invokes function only once after specified period since the last debounced function call', () => {
        debouncedFn();
        jasmine.clock().tick(500);
        expect(subject).not.toHaveBeenCalled();

        debouncedFn();
        jasmine.clock().tick(999);
        expect(subject).not.toHaveBeenCalled();

        jasmine.clock().tick(1);
        expect(subject).toHaveBeenCalledTimes(1);
    });

});
