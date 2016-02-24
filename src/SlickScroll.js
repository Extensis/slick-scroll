import React, { Component } from 'react';

const { number, func, object } = React.PropTypes;

export default class SlickScroll extends Component {
  static propTypes = {
    itemCount: number, // How many in your list
    rowHeight: number.isRequired,
    renderRow: func.isRequired, // Function to render your rows
    vpBuffer: number, // Buffer scaled by viewport height
    itemWidth: number.isRequired, // Used in rAF calculations for dynamic perRow

    // Optional map of items passed into your renderRow fn. This is probably
    // not necessary and may be removed
    itemMap: object,
  }

  static defaultProps = {
    itemCount: 0,
    vpBuffer: 4,
  }

  state = {
    rows: [],
    perRow: 3,
    viewTop: 0,
    fakeTop: 0,
  }

  boundOnScroll = this.onScroll.bind(this)

  onScroll() {
    const scrollTop = this.refs.viewport.scrollTop;

    // TODO: A lot of these are one-time calculations. May optimize out into
    //       constructor.

    this.h =  1000000; // real scrollable height
    this.ph = this.h / 100; // page height

    // th == virtual height
    this.th = Math.ceil(this.nextProps.itemCount / this.state.perRow) * this.nextProps.rowHeight;

    if (this.h > this.th) {
      this.h = this.th;
      this.ph = this.th;
    }

    this.n = Math.ceil(this.th / this.ph); // number of pages
    this.cj = (this.th - this.h) / (this.n - 1); // "jumpiness" coefficient
    if (this.n <= 1) {
      this.cj = 1;
    }

    this.page = this.page || 0; // current page
    this.offset = this.offset || 0; // current page offset
    this.prevScrollTop = this.prevScrollTop || 0;

    this.vp = this.refs.viewport.clientHeight;
    this.vw = this.refs.viewport.clientWidth;

    // jumpThresh is how much a user has to scroll in one event loop to trigger
    // moving via "jump", such that scrollbar position maps directly to item location
    let jumpThresh = 4;
    if (Math.abs(scrollTop - this.prevScrollTop) > this.vp * jumpThresh)  {
      this.onJump();
    } else {
      this.onNearScroll();
    }

    this.renderViewport();
  }

  onNearScroll() {
    const scrollTop = this.refs.viewport.scrollTop;

    // next page
    if (scrollTop + this.offset > (this.page + 1) * this.ph) {
      this.page++;
      this.offset = Math.round(this.page * this.cj);
      this.refs.viewport.scrollTop = this.prevScrollTop = scrollTop - this.cj;
      this.rows = [];
    } else if (scrollTop + this.offset < this.page * this.ph) {
      // prev page
      this.page--;
      this.offset = Math.round(this.page * this.cj);
      this.refs.viewport.scrollTop = this.prevScrollTop = scrollTop + this.cj;
      this.rows = [];
    } else {
      this.prevScrollTop = scrollTop;
    }
  }

  onJump() {
    const scrollTop = this.refs.viewport.scrollTop;
    this.page = Math.floor(
      scrollTop * ((this.th - this.vp) / (this.h - this.vp)) * (1 / this.ph)
    );
    this.offset = Math.round(this.page * this.cj);
    this.prevScrollTop = scrollTop;

    this.rows = [];
  }

  renderViewport() {
    // calculate the viewport + buffer
    let y = this.refs.viewport.scrollTop + this.offset;
    let buffer = Math.max(1, this.vp * this.props.vpBuffer);
    let top = Math.floor((y - buffer) / this.nextProps.rowHeight);
    let bottom = Math.ceil((y + this.vp + buffer) / this.nextProps.rowHeight);

    top = Math.max(0, top);
    bottom = Math.min(this.th / this.nextProps.rowHeight, bottom);

    // Do the row dance

    this.rows = [];
    for (let rowIdx = top; rowIdx < bottom; rowIdx++) {
      let items = [];
      for (let rowItemIdx = 0; rowItemIdx < this.state.perRow; rowItemIdx++) {
        let realItemIdx = rowIdx * this.state.perRow + rowItemIdx;
        if (realItemIdx >= this.nextProps.itemCount) {
          break;
        }
        items.push(realItemIdx);
      }
      this.rows.push(items);
    }

    if (!this.rows[0] || !this.state.rows[0]) {
      this.setState({ rows: this.rows });
    } else if (this.state.rows[0][0] !== this.rows[0][0]
        || this.state.rows.length !== this.rows.length
        || this.state.rows[0].length !== this.rows[0].length
      ) {
      this.setState({ rows: this.rows });
    }
  }

  componentWillReceiveProps(nextProps) {
    this.nextProps = nextProps;
    this.boundOnScroll();
  }

  rAFLoop() {
    const height = this.refs.viewport.clientHeight;
    const width = this.refs.viewport.clientWidth;

    if (this.lastHeight !== height || this.lastWidth !== width) {
      this.lastHeight = height;
      this.lastWidth = width;

      const newPerRow = (this.props.itemWidth && width) ?
        Math.floor(width / this.props.itemWidth) :
        this.state.perRow;

      this.setState({ perRow: newPerRow });

      this.boundOnScroll();

      // Using setState to trigger a rerender if it's necessary
      this.setState({ h: this.lastHeight, w: this.lastWidth });
    }

    this.rAFid = window.requestAnimationFrame(this.rAFLoop.bind(this));
  }

  componentDidMount() {
    this.nextProps = this.props;
    this.boundOnScroll();
    this.rAFid = window.requestAnimationFrame(this.rAFLoop.bind(this));
  }

  componentWillUnmount() {
    window.cancelAnimationFrame(this.rAFid);
  }

  render() {
    const outerStyle = {
      overflow: 'auto',
      maxHeight: '100%',
      flex: 1,
    };

    const contentStyle = {
      position: 'relative',
      zIndex: 1, // Prevent weird screen tearing render on chrome
      overflow: 'hidden',
      height: this.h,
    };

    return (
      <div ref='viewport' className='slick-viewport' style={outerStyle} onScroll={this.boundOnScroll}>
        <div ref='content' className= 'slick-content' style={contentStyle}>
          {this.state.rows.map(row => {
            return (
              <div key={row[0]} className='slick-row' style={{
                top: row[0] / this.state.perRow * this.nextProps.rowHeight - this.offset,
                position: 'absolute',
                width: this.vw,
              }}>
                {this.props.renderRow(row, this.nextProps.itemMap)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
