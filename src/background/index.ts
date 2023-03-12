export function dummy() {}

// chrome.runtime.onInstalled.addListener(function () {
//   chrome.contextMenus.create({
//     title: 'My context Menu"',
//     contexts: ['page', 'link'],
//     id: 'myContextMenuId',
//   });
// });

// chrome.contextMenus.onClicked.addListener((info, tab) => {
//   if (info.menuItemId === 'myContextMenuId') {
//     console.log(chrome.action);
//     chrome.action.openPopup();
//   }
// });

// 暂时先不放在右键菜单，因为这玩意没法用现在。我希望右键菜单调起popup
// see https://github.com/GoogleChrome/developer.chrome.com/issues/2602
