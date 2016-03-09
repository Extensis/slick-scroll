# SlickScroll

_Warning: very early pre-release alpha hazard zone code_

Virtual list that can scroll *trillions* of items. Potentially up to `MAX_SAFE_INTEGER - 1`. Features:

* Lots of freakin' items
* Multiple items per row
* Dynamic items per row via rAF

Inspired by [SlickGrid's Implementation](https://github.com/mleibman/SlickGrid/issues/22) 

# How it works

Read the [JSFiddle](http://jsfiddle.net/SDa2B/4/) that inspired this. This is basically a port to React of that code.

# Installation

No npm module yet. You'll need to copy and paste.

# Docs

Read the code (and then issue a PR =).

# Usage

So far, I've only tested this within flexbox.

```jsx
function renderRow(rows) => {
    const rowElements = rows.map(row => {
        const itemElements = row.map(item => <div>Item number {item}</div>)
        return <div className='row-wrapper'>{itemElements}</div>;
    });

    return <div>{rowItems}</div>
}

<div style={{ flex: 1, display: 'flex', }}>
    <SlickScroll
      itemCount={100000000}
      renderRow={this.renderRow}
      rowHeight={100}
      itemWidth={260} />
</div>
```

# Is it Web Scale?

This is mega-super-alpha. Please file issues or PRs if you would like!

# Known issues

On Safari, scrolling will loose inertia due to virtual items disappearing
- FIX/TODO: Looks like there's a fix, thanks to @jounik: [https://github.com/mleibman/SlickGrid/issues/22#issuecomment-192616461](https://github.com/mleibman/SlickGrid/issues/22#issuecomment-192616461)
# TODO

- Packaging and publishing to npm
- Migrate tests to jsdom and run tests on travis
- probably a ton of other stuff
