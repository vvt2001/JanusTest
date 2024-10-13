var el_scroll = el_scroll || {};
el_scroll.wrapper = '#Wrapper';
el_scroll.listView = [
  {
    viewId: '#canvas_section_1',
    statusLoad: false,
    currentPage: -1,
  },
  {
    viewId: '#canvas_section_2',
    statusLoad: false,
    currentPage: -1,
  },
  {
    viewId: '#canvas_section_3',
    statusLoad: false,
    currentPage: -1,
  },
];
// el_scroll.wrapper = '#viewport';
// el_scroll.listView = [
//         {viewId: '#view1', statusLoad: false, currentPage: 0},
//         {viewId: '#view2', statusLoad: false, currentPage: 0},
//         {viewId: '#view3', statusLoad: false, currentPage: 0}
//     ];
el_scroll.currentViewIndex = 0;
el_scroll.pageHeight = 990;
el_scroll.viewPortHeight = 700;
el_scroll.currentPage = 0;
el_scroll.totalPage = 100;
el_scroll.timeoutScroll = false;

$(document).ready(async function () {
  if (eldraw) {
    await eldraw.util.loadMathFont();
  }
});

el_scroll.onScroll = function (scrollTop) {
  let scrollPage = parseInt(
    (scrollTop + this.viewPortHeight / 2) / el_scroll.pageHeight,
  );

  if (scrollPage > this.currentPage) {
    console.log('scroll down');
    this.currentViewIndex++;
    if (this.currentViewIndex === 3) {
      this.currentViewIndex = 0;
    }
    el_scroll.onPageChange(scrollPage, this.currentPage);
    this.currentPage = scrollPage;
  } else if (scrollPage < this.currentPage) {
    console.log('scroll up');

    this.currentViewIndex--;
    if (this.currentViewIndex === -1) {
      this.currentViewIndex = 2;
    }
    el_scroll.onPageChange(scrollPage, this.currentPage);
    this.currentPage = scrollPage;
  }
};

el_scroll.setTotalPage = function (total_page) {
  this.totalPage = total_page;
  $(this.listView[1].viewId).show();
  $(this.listView[2].viewId).show();
  if (this.totalPage === 1) {
    $(this.listView[1].viewId).hide();
    $(this.listView[2].viewId).hide();
  } else if (this.totalPage === 2) {
    $(this.listView[2].viewId).hide();
  }
};

el_scroll.onPageChange = function (page) {
  clearTimeout(el_scroll.timeoutScroll);
  el_scroll.timeoutScroll = setTimeout(function () {
    let view = el_scroll.getView(0);
    if (!view.statusLoad || view.currentPage !== el_scroll.currentPage) {
      el_scroll.preloadView(0);
    }
    if (page === 0) {
      let prevView = el_scroll.getView(2);
      if (prevView) {
        if (
          !prevView.statusLoad ||
          prevView.currentPage !== el_scroll.currentPage + 2
        ) {
          el_scroll.preloadView(2);
        }
      }
    } else {
      let prevView = el_scroll.getView(-1);
      if (
        !prevView.statusLoad ||
        prevView.currentPage !== el_scroll.currentPage - 1
      ) {
        el_scroll.preloadView(-1);
      }
    }

    let nextView = el_scroll.getView(1);
    if (
      !nextView.statusLoad ||
      nextView.currentPage !== el_scroll.currentPage + 1
    ) {
      el_scroll.preloadView(1);
    }
  }, 300);

  // $('#currentPage').text(page);
  // $('#currentView').text(el_scroll.getView(0).viewId);
};

el_scroll.preloadView = function (index) {
  if (
    this.currentPage + index >= this.totalPage ||
    this.currentPage + index < 0
  ) {
    return;
  }
  let viewIndex = this.currentViewIndex + index;
  if (viewIndex === -1) {
    viewIndex = 2;
  } else if (viewIndex === 3) {
    viewIndex = 0;
  }

  let view = this.listView[viewIndex];
  $(view.viewId).css(
    'top',
    (this.currentPage + index) * this.pageHeight + 'px',
  );
  view.statusLoad = false;
  view.currentPage = this.currentPage + index;
  el_scroll.preloadContentView(view);
};

el_scroll.preloadContentView = function (view) {};

el_scroll.getView = function (index) {
  let viewIndex = this.currentViewIndex + index;
  if (viewIndex === -1) {
    viewIndex = 2;
  } else if (viewIndex === 3) {
    viewIndex = 0;
  }

  return this.listView[viewIndex];
};
