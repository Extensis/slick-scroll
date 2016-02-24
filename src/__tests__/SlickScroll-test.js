import React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';

import SlickScroll from '../SlickScroll';

describe('SlickScroll', () => {
  let slickScroll;
  let _rowHeight = 52;
  let _viewHeight = 503;
  let _itemWidth = 160;

  function renderComponent(props, options) {
    if (slickScroll) {
      slickScroll.detach();
    }

    options = {
      rowHeight: _rowHeight,
      viewHeight: _viewHeight,
      itemWidth: _itemWidth,
      ...options,
    };

    props = {
      itemCount: 1234567, // 1.2 million
      itemMap: {},
      renderRow: row => <div className='fooBar' key={row[0]}>Foo {row[0]}</div>,
      rowHeight: options.rowHeight,
      itemWidth: options.itemWidth,
      vpBuffer: 1, // TOOD: Test with different buffers!
      ...props,
    };

    let root = document.createElement('div');
    root.style.position = 'absolute';
    root.style.width = '501px';
    root.style.height = `${options.viewHeight}px`;
    root.style.flex = '1';
    root.style.display = 'flex';

    document.body.appendChild(root);

    slickScroll = mount(<SlickScroll {...props} />, { attachTo: root });
  };

  beforeEach(() => renderComponent());
  afterEach(() => slickScroll.detach());

  it('renders rows with a buffer of rows', () => {
    let found = slickScroll.find('.slick-row');
    assert.isAbove(found.length, Math.floor(_viewHeight / _rowHeight) * 2);
    assert.isBelow(found.length, Math.floor(_viewHeight / _rowHeight) * 3);

    let newRowHeight = 22;
    let newViewHeight = 600;

    renderComponent({}, { rowHeight: newRowHeight, viewHeight: newViewHeight });

    found = slickScroll.find('.slick-row');
    assert.isAbove(found.length, Math.floor(newViewHeight / newRowHeight) * 2);
    assert.isBelow(found.length, Math.floor(newViewHeight / newRowHeight) * 3);
  });

  it('renders a big honkin virtual viewport', () => {
    const content = slickScroll.find('.slick-content').get(0);
    assert.isAbove(content.clientHeight, 1e5);
  });

  it('renders a big viewport.. but not too big!', () => {
    const content = slickScroll.find('.slick-content').get(0);
    assert.isBelow(content.clientHeight, 1e8);
  });

  it('scrolls normally when scroll delta is small', async function() {
    const view = slickScroll.find('.slick-viewport').first();

    const getFirstRowText = () => view.find('.slick-row').first().text();
    const getLastRowText  = () => view.find('.slick-row').last() .text();

    // Should start off on the first row..
    assert.equal(getFirstRowText(), 'Foo 0');
    // And render a buffer of who-know-how-much..?
    assert.equal(getLastRowText(), 'Foo 57');

    view.get(0).scrollTop += 35;
    await new Promise(resolve => setTimeout(() => resolve(), 100));

    assert.equal(getFirstRowText(), 'Foo 0');
    assert.equal(getLastRowText(), 'Foo 60');

    view.get(0).scrollTop += 100;
    await new Promise(resolve => setTimeout(() => resolve(), 100));

    assert.equal(getFirstRowText(), 'Foo 0');
    assert.equal(getLastRowText(), 'Foo 63');

    view.get(0).scrollTop += 100;
    await new Promise(resolve => setTimeout(() => resolve(), 100));

    assert.equal(getFirstRowText(), 'Foo 0');
    assert.equal(getLastRowText(), 'Foo 69');

    view.get(0).scrollTop += 500;
    await new Promise(resolve => setTimeout(() => resolve(), 100));

    assert.equal(getFirstRowText(), 'Foo 12');
    assert.equal(getLastRowText(), 'Foo 99');
  });

  // Reference: Our 'totalRealHeight' is 1e6, but the virtual height is
  // totalRows * rowHeight, which is ~ 7e7.
  it('scrolls all big-like when a big delta gets goin', async function() {
    const view = slickScroll.find('.slick-viewport').first();

    const getFirstRowText = () => view.find('.slick-row').first().text();
    const getLastRowText  = () => view.find('.slick-row').last() .text();

    assert.equal(getFirstRowText(), 'Foo 0');
    assert.equal(getLastRowText(), 'Foo 57');

    view.get(0).scrollTop += 35;
    await new Promise(resolve => setTimeout(() => resolve(), 100));

    assert.equal(getFirstRowText(), 'Foo 0');
    assert.equal(getLastRowText(), 'Foo 60');

    let totalRealHeight = slickScroll.find('.slick-content').get(0).clientHeight;
    assert.equal(totalRealHeight, 1e6);
    view.get(0).scrollTop = totalRealHeight / 2;
    await new Promise(resolve => setTimeout(() => resolve(), 100));

    /// ~612k is about half of our 1.2mil
    assert.equal(getFirstRowText(), 'Foo 617529');
    assert.equal(getLastRowText(), 'Foo 617616');

  });

});
