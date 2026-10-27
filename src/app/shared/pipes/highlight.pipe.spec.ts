import { HighlightPipe } from './highlight.pipe';

describe('HighlightPipe', () => {
    const pipe = new HighlightPipe();

    it('marks every match ignoring case', () => {
        expect(pipe.transform('Plaza Mayor, plaza', 'PLAZA')).toEqual([
            { text: 'Plaza', match: true },
            { text: ' Mayor, ', match: false },
            { text: 'plaza', match: true },
        ]);
    });

    it('returns the whole text without a query and nothing without text', () => {
        expect(pipe.transform('Plaza Mayor', '  ')).toEqual([{ text: 'Plaza Mayor', match: false }]);
        expect(pipe.transform(null, 'plaza')).toEqual([]);
    });
});
