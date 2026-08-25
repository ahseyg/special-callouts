/**
 * parser.ts — metadata extraction and parameter parsing.
 *
 * These cases double as the executable version of the behaviour documented in
 * skills/special-callouts/references/parameters.md. If a change here makes a test fail,
 * that reference needs updating in the same commit.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { loadModule, PALETTE } from './helpers.mjs';

const { parseMetadata, parseGridLayout, extractMetadata, findMetadataSpan } = await loadModule('src/parser.ts');

/** Parses metadata content with the default palette and no custom colours. */
const parse = (content, layouts = []) => parseMetadata(content, PALETTE, [], layouts);

describe('extractMetadata', () => {
    test('reads a metadata block and the title after it', () => {
        assert.deepEqual(extractMetadata('(bg:red) My Title'), { content: 'bg:red', title: 'My Title' });
    });

    test('tolerates leading whitespace before the block', () => {
        assert.equal(extractMetadata('   (bg:red) T').content, 'bg:red');
    });

    test('keeps nested parentheses intact rather than stopping at the first close', () => {
        assert.equal(
            extractMetadata('(text:(white, dark-border), bg:red) T').content,
            'text:(white, dark-border), bg:red'
        );
    });

    test('returns null when metadata follows the title instead of preceding it', () => {
        assert.equal(extractMetadata('My Title (bg:red)'), null);
    });

    test('returns null on an unbalanced block, dropping it whole', () => {
        assert.equal(extractMetadata('(bg:red My Title'), null);
    });

    test('handles an empty title', () => {
        assert.deepEqual(extractMetadata('(compact)'), { content: 'compact', title: '' });
    });
});

describe('colours', () => {
    test('resolves a palette name to its hex', () => {
        assert.equal(parse('bg:red').config.bg, '#e74c3c');
    });

    test('accepts a hex code unchanged', () => {
        assert.equal(parse('bg:#ff0000').config.bg, '#ff0000');
    });

    test('resolves a custom colour name', () => {
        const { config } = parseMetadata('bg:brand', PALETTE, [{ name: 'brand', hex: '#1a73e8' }]);
        assert.equal(config.bg, '#1a73e8');
    });

    test('passes an unknown name straight through to CSS', () => {
        assert.equal(parse('bg:rebeccapurple').config.bg, 'rebeccapurple');
    });

    test('background is an alias of bg', () => {
        assert.equal(parse('background:blue').config.bg, '#3498db');
    });

    test('keys are case-insensitive', () => {
        assert.equal(parse('BG:red').config.bg, '#e74c3c');
    });

    test('title sets the title colour', () => {
        assert.equal(parse('title:green').config.titleColor, '#2ecc71');
    });

    test('link sets the link colour', () => {
        assert.equal(parse('link:blue').config.link, '#3498db');
    });
});

describe('readability strokes', () => {
    test('text accepts a stroke keyword in place of a colour', () => {
        const { config } = parse('text:dark-border');
        assert.equal(config.textBorder, 'dark-border');
        assert.equal(config.text, '');
    });

    test('grouped syntax sets colour and stroke together', () => {
        const { config } = parse('text:(white, dark-border)');
        assert.equal(config.text, 'white');
        assert.equal(config.textBorder, 'dark-border');
    });

    test('grouped syntax works for title, including centring', () => {
        const { config } = parse('title:(center, blue, light-border)');
        assert.equal(config.titleCenter, true);
        assert.equal(config.titleColor, '#3498db');
        assert.equal(config.titleBorder, 'light-border');
    });

    test('link takes a stroke too', () => {
        assert.equal(parse('link:light-border').config.linkBorder, 'light-border');
    });
});

describe('standalone flags', () => {
    test('no-icon and its alias', () => {
        assert.equal(parse('no-icon').config.noIcon, true);
        assert.equal(parse('noicon').config.noIcon, true);
    });

    test('center', () => {
        assert.equal(parse('center').config.center, true);
    });

    test('compact', () => {
        assert.equal(parse('compact').config.compact, true);
    });

    test('dense also sets compact, since it is a superset of it', () => {
        assert.equal(parse('dense').config.compact, true);
    });

    test('title:center centres only the title', () => {
        const { config } = parse('title:center');
        assert.equal(config.titleCenter, true);
        assert.equal(config.center, false);
    });

    test('padding:0 is an undocumented alias of compact', () => {
        assert.equal(parse('padding:0').config.compact, true);
    });

    test('any other padding value is ignored', () => {
        assert.equal(parse('padding:8').config.compact, false);
    });
});

describe('borders and shape', () => {
    test('border keeps the keyword none for the processor to act on', () => {
        assert.equal(parse('border:none').config.border, 'none');
    });

    test('border-width and radius stay unitless at parse time', () => {
        const { config } = parse('border-width:4, radius:20');
        assert.equal(config.borderWidth, '4');
        assert.equal(config.radius, '20');
    });

    test('border-style passes through', () => {
        assert.equal(parse('border-style:dashed').config.borderStyle, 'dashed');
    });
});

describe('typography', () => {
    test('font is lowercased; the processor decides which names are real', () => {
        assert.equal(parse('font:MONO').config.font, 'mono');
    });

    test('font-size accepts 1 to 5', () => {
        assert.equal(parse('font-size:1').config.fontSize, 1);
        assert.equal(parse('font-size:5').config.fontSize, 5);
    });

    test('font-size outside the range is ignored', () => {
        assert.equal(parse('font-size:0').config.fontSize, null);
        assert.equal(parse('font-size:6').config.fontSize, null);
        assert.equal(parse('font-size:big').config.fontSize, null);
    });

    test('icon is lowercased', () => {
        assert.equal(parse('icon:Rocket').config.icon, 'rocket');
    });
});

describe('columns', () => {
    test('col and its alias', () => {
        assert.equal(parse('col:3').config.col, 3);
        assert.equal(parse('column:2').config.col, 2);
    });

    test('a non-numeric col is ignored', () => {
        assert.equal(parse('col:many').config.col, null);
    });
});

describe('grid token', () => {
    test('a bare position:columns token is pulled out of the metadata', () => {
        assert.equal(parse('1:3').layoutParam, '1:3');
    });

    test('it is found alongside other parameters', () => {
        const { config, layoutParam } = parse('bg:red, 2:3, compact');
        assert.equal(layoutParam, '2:3');
        assert.equal(config.bg, '#e74c3c');
        assert.equal(config.compact, true);
    });

    test('key:value pairs containing digits are not mistaken for it', () => {
        assert.equal(parse('col:2').layoutParam, null);
        assert.equal(parse('radius:20, font-size:4').layoutParam, null);
    });
});

describe('parseGridLayout', () => {
    test('position and column count', () => {
        assert.deepEqual(parseGridLayout('1:3'), { position: 1, columns: 3, row: 1 });
    });

    test('comma and slash separators are accepted', () => {
        assert.equal(parseGridLayout('2,4').columns, 4);
        assert.equal(parseGridLayout('2/4').columns, 4);
    });

    test('an explicit row is carried through', () => {
        assert.deepEqual(parseGridLayout('2:3:2'), { position: 2, columns: 3, row: 2 });
    });

    test('anything else is null', () => {
        assert.equal(parseGridLayout('abc'), null);
        assert.equal(parseGridLayout('1'), null);
    });
});

describe('span parameter', () => {
    test('sets column span count', () => {
        assert.equal(parse('span:2').config.span, 2);
        assert.equal(parse('1:3, span:3').config.span, 3);
    });

    test('ignores invalid or non-positive span values', () => {
        assert.equal(parse('span:0').config.span, null);
        assert.equal(parse('span:-1').config.span, null);
        assert.equal(parse('span:invalid').config.span, null);
    });
});

describe('presets and saved layouts', () => {
    test('style: names a custom preset', () => {
        assert.equal(parse('style:my-card').styleParam, 'my-card');
    });

    test('a bare word matching a saved layout selects it', () => {
        assert.equal(parse('my_dashboard', ['my_dashboard']).config.customLayout, 'my_dashboard');
    });

    test('a bare word with no matching layout is simply ignored', () => {
        assert.equal(parse('my_dashboard').config.customLayout, null);
    });
});

describe('robustness', () => {
    test('an unknown key is skipped while its neighbours still apply', () => {
        const { config } = parse('bg:red, nonsense:42, compact');
        assert.equal(config.bg, '#e74c3c');
        assert.equal(config.compact, true);
    });

    test('empty metadata yields defaults', () => {
        const { config } = parse('');
        assert.equal(config.bg, '');
        assert.equal(config.compact, false);
        assert.equal(config.col, null);
    });

    test('extra whitespace around parameters is tolerated', () => {
        const { config } = parse('  bg:red ,  compact  ');
        assert.equal(config.bg, '#e74c3c');
        assert.equal(config.compact, true);
    });
});

describe('dense vs compact', () => {
    test('compact alone does not set dense', () => {
        const { config } = parse('compact');
        assert.equal(config.compact, true);
        assert.equal(config.dense, false);
    });

    test('dense sets both, so it stays a superset of compact', () => {
        const { config } = parse('dense');
        assert.equal(config.compact, true);
        assert.equal(config.dense, true);
    });

    test('dense works as a key:value pair too', () => {
        assert.equal(parse('dense:true').config.dense, true);
    });
});

describe('icon colour', () => {
    test('icon-color resolves like any other colour', () => {
        assert.equal(parse('icon-color:red').config.iconColor, '#e74c3c');
        assert.equal(parse('icon-color:#00ff00').config.iconColor, '#00ff00');
    });

    test('iconcolor is accepted as an alias', () => {
        assert.equal(parse('iconcolor:blue').config.iconColor, '#3498db');
    });

    test('it is independent of title, so the two can differ', () => {
        const { config } = parse('title:red, icon-color:blue');
        assert.equal(config.titleColor, '#e74c3c');
        assert.equal(config.iconColor, '#3498db');
    });

    test('defaults to empty so the title colour governs the icon', () => {
        assert.equal(parse('title:red').config.iconColor, '');
    });
});

describe('grouped values', () => {
    test('a group is shorthand for repeating the key, so every parameter accepts one', () => {
        assert.equal(parse('bg:(red)').config.bg, '#e74c3c');
        assert.equal(parse('border:(blue)').config.border, '#3498db');
        assert.equal(parse('radius:(12)').config.radius, '12');
    });

    test('the last value wins where repeating the key makes no sense', () => {
        assert.equal(parse('radius:(10, 20)').config.radius, '20');
    });

    test('a value carrying its own parentheses is left alone', () => {
        assert.equal(parse('bg:rgba(0,0,0,0.5)').config.bg, 'rgba(0,0,0,0.5)');
    });

    test('empty members are dropped rather than parsed as blanks', () => {
        const { config } = parse('text:(white, , dark-border)');
        assert.equal(config.text, 'white');
        assert.equal(config.textBorder, 'dark-border');
    });
});

describe('malformed input', () => {
    test('a key with nothing after the colon is skipped, not applied as empty', () => {
        assert.equal(parse('bg:').config.bg, '');
        assert.equal(parse('title:').config.titleColor, '');
    });

    test('stray separators do not disturb the parameters around them', () => {
        const { config } = parse('bg:red, , compact');
        assert.equal(config.bg, '#e74c3c');
        assert.equal(config.compact, true);
    });

    test('a colon with no key in front of it is ignored', () => {
        assert.doesNotThrow(() => parse(':red'));
        assert.equal(parse(':red').config.bg, '');
    });
});

describe('style parameter', () => {
    test('a style name may contain a colon', () => {
        assert.equal(parse('style:Note: Important').styleParam, 'note: important');
    });

    test('style with no name resolves to null rather than an empty lookup', () => {
        assert.equal(parse('style:').styleParam, null);
    });
});

describe('border shorthands', () => {
    test('bw is border-width', () => {
        assert.equal(parse('bw:4').config.borderWidth, '4');
        assert.equal(parse('border-width:4').config.borderWidth, '4');
    });

    test('bs is border-style', () => {
        assert.equal(parse('bs:dashed').config.borderStyle, 'dashed');
        assert.equal(parse('border-style:dashed').config.borderStyle, 'dashed');
    });
});

describe('layout token removal', () => {
    test('pulling the layout out leaves the other parameters intact', () => {
        const { config, layoutParam } = parse('bg:red, 2:3, compact');
        assert.equal(layoutParam, '2:3');
        assert.equal(config.bg, '#e74c3c');
        assert.equal(config.compact, true);
    });

    test('a parameter that merely looks like the token is not the one removed', () => {
        const { config, layoutParam } = parse('radius:8, 1:2');
        assert.equal(layoutParam, '1:2');
        assert.equal(config.radius, '8');
    });
});

describe('layout scan and parenthesised values', () => {
    test('digits inside a value are not mistaken for the layout token', () => {
        const { config, layoutParam } = parse('bg:rgba(0,0,0,0.5)');
        assert.equal(layoutParam, null);
        assert.equal(config.bg, 'rgba(0,0,0,0.5)');
    });

    test('a real layout token is still found alongside such a value', () => {
        const { config, layoutParam } = parse('bg:rgba(0,0,0,0.5), 2:3');
        assert.equal(layoutParam, '2:3');
        assert.equal(config.bg, 'rgba(0,0,0,0.5)');
    });

    test('the token may still be written with commas', () => {
        assert.equal(parse('1,3').layoutParam, '1,3');
    });
});

describe('findMetadataSpan', () => {
    test('locates the block after the callout header', () => {
        const line = '> [!note] (bg:red) Title';
        const span = findMetadataSpan(line, line.indexOf(']') + 1);
        assert.equal(span.content, 'bg:red');
        assert.equal(line.slice(span.start, span.end + 1), '(bg:red)');
    });

    test('counts depth, so a grouped value is captured whole', () => {
        const line = '> [!note] (text:(white, dark-border), bg:red) Title';
        const span = findMetadataSpan(line, line.indexOf(']') + 1);
        assert.equal(span.content, 'text:(white, dark-border), bg:red');
    });

    test('skips the spaces between the header and the block', () => {
        const line = '> [!note]    (bg:red)';
        assert.equal(findMetadataSpan(line, line.indexOf(']') + 1).content, 'bg:red');
    });

    test('null when the block never closes, rather than a guess', () => {
        assert.equal(findMetadataSpan('> [!note] (bg:red', 9), null);
    });

    test('null when the next thing is the title rather than a block', () => {
        assert.equal(findMetadataSpan('> [!note] Title (bg:red)', 9), null);
    });

    test('extractMetadata is built on it, so the two cannot disagree', () => {
        const text = '(text:(white, dark-border)) T';
        assert.equal(extractMetadata(text).content, findMetadataSpan(text, 0).content);
    });
});

describe('layout names versus built-in flags', () => {
    test('a built-in flag wins over a saved layout of the same name', () => {
        const { config } = parse('compact', ['compact']);
        assert.equal(config.compact, true);
        assert.equal(config.customLayout, null);
    });

    test('the same holds for the other bare-word flags', () => {
        assert.equal(parse('center', ['center']).config.center, true);
        assert.equal(parse('no-icon', ['no-icon']).config.noIcon, true);
        assert.equal(parse('dense', ['dense']).config.dense, true);
    });

    test('a layout whose name is not a flag still applies', () => {
        const { config } = parse('my_dashboard', ['my_dashboard']);
        assert.equal(config.customLayout, 'my_dashboard');
    });
});
