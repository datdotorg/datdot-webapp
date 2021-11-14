const make_grid = require('make-grid')
const message_maker = require('message-maker')
const make_element = require('make-element')
const style_sheet = require('support-style-sheet')
// components
const i_container = require('container')
const i_footer = require('footer')

module.exports = wallet

// accounts option
const path = 'https://avatars.dicebear.com/api/bottts'
const accounts_list_theme = {
  props: {
    icon_size: '24px',
    icon_size_hover: '24px',
    current_icon_size: '24px',
    avatar_width: '24px',
    padding: '4px 8px'
  }
}
let accounts_option = [
  {
      list_name: 'account1',
      address: '0x288e86504a82c93c85b208a23ed9ff6f423e966f1c5c87f7b367378bed0430479',
      // text: 'account1',
      // cover: 'data:image/svg+xml;base64,PHN2ZyB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMTgwIDE4MCI+PG1ldGFkYXRhPjxyZGY6UkRGPjxjYzpXb3JrPjxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PjxkYzp0eXBlIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiLz48ZGM6dGl0bGU+Qm90dHRzPC9kYzp0aXRsZT48ZGM6Y3JlYXRvcj48Y2M6QWdlbnQ+PGRjOnRpdGxlPlBhYmxvIFN0YW5sZXk8L2RjOnRpdGxlPjwvY2M6QWdlbnQ+PC9kYzpjcmVhdG9yPjxkYzpzb3VyY2U+aHR0cHM6Ly9ib3R0dHMuY29tLzwvZGM6c291cmNlPjxjYzpsaWNlbnNlIHJkZjpyZXNvdXJjZT0iaHR0cHM6Ly9ib3R0dHMuY29tLyIvPjxkYzpjb250cmlidXRvcj48Y2M6QWdlbnQ+PGRjOnRpdGxlPkZsb3JpYW4gS8O2cm5lcjwvZGM6dGl0bGU+PC9jYzpBZ2VudD48L2RjOmNvbnRyaWJ1dG9yPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48bWFzayBpZD0iYXZhdGFyc1JhZGl1c01hc2siPjxyZWN0IHdpZHRoPSIxODAiIGhlaWdodD0iMTgwIiByeD0iMCIgcnk9IjAiIHg9IjAiIHk9IjAiIGZpbGw9IiNmZmYiLz48L21hc2s+PGcgbWFzaz0idXJsKCNhdmF0YXJzUmFkaXVzTWFzaykiPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsIDY2KSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMyAxMUgxMVYzMUgxMi40QzEwLjE1OTggMzEgOS4wMzk2OSAzMSA4LjE4NDA0IDMxLjQzNkM3LjQzMTM5IDMxLjgxOTUgNi44MTk0NyAzMi40MzE0IDYuNDM1OTcgMzMuMTg0QzYgMzQuMDM5NyA2IDM1LjE1OTggNiAzNy40VjM4LjZDNiA0MC44NDAyIDYgNDEuOTYwMyA2LjQzNTk3IDQyLjgxNkM2LjgxOTQ3IDQzLjU2ODYgNy40MzEzOSA0NC4xODA1IDguMTg0MDQgNDQuNTY0QzkuMDM5NjkgNDUgMTAuMTU5OCA0NSAxMi40IDQ1SDE4VjU1LjZDMTggNTcuODQwMiAxOCA1OC45NjAzIDE4LjQzNiA1OS44MTZDMTguODE5NSA2MC41Njg2IDE5LjQzMTQgNjEuMTgwNSAyMC4xODQgNjEuNTY0QzIxLjAzOTcgNjIgMjIuMTU5OCA2MiAyNC40IDYySDQ3LjZDNDkuODQwMiA2MiA1MC45NjAzIDYyIDUxLjgxNiA2MS41NjRDNTIuNTY4NiA2MS4xODA1IDUzLjE4MDUgNjAuNTY4NiA1My41NjQgNTkuODE2QzU0IDU4Ljk2MDMgNTQgNTcuODQwMiA1NCA1NS42VjIwLjRDNTQgMTguMTU5OCA1NCAxNy4wMzk3IDUzLjU2NCAxNi4xODRDNTMuMTgwNSAxNS40MzE0IDUyLjU2ODYgMTQuODE5NSA1MS44MTYgMTQuNDM2QzUwLjk2MDMgMTQgNDkuODQwMiAxNCA0Ny42IDE0SDI0LjRDMjIuMTU5OCAxNCAyMS4wMzk3IDE0IDIwLjE4NCAxNC40MzZDMTkuNDMxNCAxNC44MTk1IDE4LjgxOTUgMTUuNDMxNCAxOC40MzYgMTYuMTg0QzE4IDE3LjAzOTcgMTggMTguMTU5OCAxOCAyMC40VjMxSDEzVjExWk0xMjYgMzQuNEMxMjYgMzIuMTU5OCAxMjYgMzEuMDM5NyAxMjYuNDM2IDMwLjE4NEMxMjYuODE5IDI5LjQzMTQgMTI3LjQzMSAyOC44MTk1IDEyOC4xODQgMjguNDM2QzEyOS4wNCAyOCAxMzAuMTYgMjggMTMyLjQgMjhIMTU1LjZDMTU3Ljg0IDI4IDE1OC45NiAyOCAxNTkuODE2IDI4LjQzNkMxNjAuNTY5IDI4LjgxOTUgMTYxLjE4MSAyOS40MzE0IDE2MS41NjQgMzAuMTg0QzE2MiAzMS4wMzk3IDE2MiAzMi4xNTk4IDE2MiAzNC40VjQ1LjZDMTYyIDQ3Ljg0MDIgMTYyIDQ4Ljk2MDMgMTYxLjU2NCA0OS44MTZDMTYxLjE4MSA1MC41Njg2IDE2MC41NjkgNTEuMTgwNSAxNTkuODE2IDUxLjU2NEMxNTguOTYgNTIgMTU3Ljg0IDUyIDE1NS42IDUySDEzMi40QzEzMC4xNiA1MiAxMjkuMDQgNTIgMTI4LjE4NCA1MS41NjRDMTI3LjQzMSA1MS4xODA1IDEyNi44MTkgNTAuNTY4NiAxMjYuNDM2IDQ5LjgxNkMxMjYgNDguOTYwMyAxMjYgNDcuODQwMiAxMjYgNDUuNlYzNC40WiIgZmlsbD0iIzAwNzZERSIvPjxtYXNrIGlkPSJzaWRlc0FudGVubmEwMU1hc2swIiBtYXNrLXR5cGU9ImFscGhhIiBtYXNrVW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4PSI2IiB5PSIxMSIgd2lkdGg9IjE1NiIgaGVpZ2h0PSI1MSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMyAxMUgxMVYzMUgxMi40QzEwLjE1OTggMzEgOS4wMzk2OSAzMSA4LjE4NDA0IDMxLjQzNkM3LjQzMTM5IDMxLjgxOTUgNi44MTk0NyAzMi40MzE0IDYuNDM1OTcgMzMuMTg0QzYgMzQuMDM5NyA2IDM1LjE1OTggNiAzNy40VjM4LjZDNiA0MC44NDAyIDYgNDEuOTYwMyA2LjQzNTk3IDQyLjgxNkM2LjgxOTQ3IDQzLjU2ODYgNy40MzEzOSA0NC4xODA1IDguMTg0MDQgNDQuNTY0QzkuMDM5NjkgNDUgMTAuMTU5OCA0NSAxMi40IDQ1SDE4VjU1LjZDMTggNTcuODQwMiAxOCA1OC45NjAzIDE4LjQzNiA1OS44MTZDMTguODE5NSA2MC41Njg2IDE5LjQzMTQgNjEuMTgwNSAyMC4xODQgNjEuNTY0QzIxLjAzOTcgNjIgMjIuMTU5OCA2MiAyNC40IDYySDQ3LjZDNDkuODQwMiA2MiA1MC45NjAzIDYyIDUxLjgxNiA2MS41NjRDNTIuNTY4NiA2MS4xODA1IDUzLjE4MDUgNjAuNTY4NiA1My41NjQgNTkuODE2QzU0IDU4Ljk2MDMgNTQgNTcuODQwMiA1NCA1NS42VjIwLjRDNTQgMTguMTU5OCA1NCAxNy4wMzk3IDUzLjU2NCAxNi4xODRDNTMuMTgwNSAxNS40MzE0IDUyLjU2ODYgMTQuODE5NSA1MS44MTYgMTQuNDM2QzUwLjk2MDMgMTQgNDkuODQwMiAxNCA0Ny42IDE0SDI0LjRDMjIuMTU5OCAxNCAyMS4wMzk3IDE0IDIwLjE4NCAxNC40MzZDMTkuNDMxNCAxNC44MTk1IDE4LjgxOTUgMTUuNDMxNCAxOC40MzYgMTYuMTg0QzE4IDE3LjAzOTcgMTggMTguMTU5OCAxOCAyMC40VjMxSDEzVjExWk0xMjYgMzQuNEMxMjYgMzIuMTU5OCAxMjYgMzEuMDM5NyAxMjYuNDM2IDMwLjE4NEMxMjYuODE5IDI5LjQzMTQgMTI3LjQzMSAyOC44MTk1IDEyOC4xODQgMjguNDM2QzEyOS4wNCAyOCAxMzAuMTYgMjggMTMyLjQgMjhIMTU1LjZDMTU3Ljg0IDI4IDE1OC45NiAyOCAxNTkuODE2IDI4LjQzNkMxNjAuNTY5IDI4LjgxOTUgMTYxLjE4MSAyOS40MzE0IDE2MS41NjQgMzAuMTg0QzE2MiAzMS4wMzk3IDE2MiAzMi4xNTk4IDE2MiAzNC40VjQ1LjZDMTYyIDQ3Ljg0MDIgMTYyIDQ4Ljk2MDMgMTYxLjU2NCA0OS44MTZDMTYxLjE4MSA1MC41Njg2IDE2MC41NjkgNTEuMTgwNSAxNTkuODE2IDUxLjU2NEMxNTguOTYgNTIgMTU3Ljg0IDUyIDE1NS42IDUySDEzMi40QzEzMC4xNiA1MiAxMjkuMDQgNTIgMTI4LjE4NCA1MS41NjRDMTI3LjQzMSA1MS4xODA1IDEyNi44MTkgNTAuNTY4NiAxMjYuNDM2IDQ5LjgxNkMxMjYgNDguOTYwMyAxMjYgNDcuODQwMiAxMjYgNDUuNlYzNC40WiIgZmlsbD0id2hpdGUiLz48L21hc2s+PGcgbWFzaz0idXJsKCNzaWRlc0FudGVubmEwMU1hc2swKSI+PHJlY3Qgd2lkdGg9IjE4MCIgaGVpZ2h0PSI3NiIgZmlsbD0iIzI5QjZGNiIvPjxyZWN0IHk9IjM4IiB3aWR0aD0iMTgwIiBoZWlnaHQ9IjM4IiBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIwLjEiLz48L2c+PHJlY3QgeD0iMTEiIHk9IjExIiB3aWR0aD0iMiIgaGVpZ2h0PSIyMCIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC40Ii8+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMiAxMkMxNC4yMDkxIDEyIDE2IDEwLjIwOTEgMTYgOEMxNiA1Ljc5MDg2IDE0LjIwOTEgNCAxMiA0QzkuNzkwODYgNCA4IDUuNzkwODYgOCA4QzggMTAuMjA5MSA5Ljc5MDg2IDEyIDEyIDEyWiIgZmlsbD0iI0ZGRUE4RiIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTMgOUMxNC4xMDQ2IDkgMTUgOC4xMDQ1NyAxNSA3QzE1IDUuODk1NDMgMTQuMTA0NiA1IDEzIDVDMTEuODk1NCA1IDExIDUuODk1NDMgMTEgN0MxMSA4LjEwNDU3IDExLjg5NTQgOSAxMyA5WiIgZmlsbD0id2hpdGUiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNDEsIDApIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTQ4IDBDMzkuMTYzNCAwIDMyIDcuMTYzNDQgMzIgMTZWMzJDMzIgMzYuNDE4MyAzNS41ODE3IDQwIDQwIDQwSDIzQzIyLjQ0NzcgNDAgMjIgNDAuNDQ3NyAyMiA0MVY1MUMyMiA1MS41NTIzIDIyLjQ0NzcgNTIgMjMgNTJINzdDNzcuNTUyMyA1MiA3OCA1MS41NTIzIDc4IDUxVjQxQzc4IDQwLjQ0NzcgNzcuNTUyMyA0MCA3NyA0MEg2MEM2NC40MTgzIDQwIDY4IDM2LjQxODMgNjggMzJWMTZDNjggNy4xNjM0NCA2MC44MzY2IDAgNTIgMEg0OFoiIGZpbGw9IiM1OUM0RkYiLz48bWFzayBpZD0idG9wQnVsYjAxMU1hc2swIiBtYXNrLXR5cGU9ImFscGhhIiBtYXNrVW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4PSIyMiIgeT0iMCIgd2lkdGg9IjU2IiBoZWlnaHQ9IjUyIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTQ4IDBDMzkuMTYzNCAwIDMyIDcuMTYzNDQgMzIgMTZWMzJDMzIgMzYuNDE4MyAzNS41ODE3IDQwIDQwIDQwSDIzQzIyLjQ0NzcgNDAgMjIgNDAuNDQ3NyAyMiA0MVY1MUMyMiA1MS41NTIzIDIyLjQ0NzcgNTIgMjMgNTJINzdDNzcuNTUyMyA1MiA3OCA1MS41NTIzIDc4IDUxVjQxQzc4IDQwLjQ0NzcgNzcuNTUyMyA0MCA3NyA0MEg2MEM2NC40MTgzIDQwIDY4IDM2LjQxODMgNjggMzJWMTZDNjggNy4xNjM0NCA2MC44MzY2IDAgNTIgMEg0OFoiIGZpbGw9IndoaXRlIi8+PC9tYXNrPjxnIG1hc2s9InVybCgjdG9wQnVsYjAxMU1hc2swKSI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSI1MiIgZmlsbD0iIzI5QjZGNiIvPjxyZWN0IHg9IjIwIiB5PSItMyIgd2lkdGg9IjYwIiBoZWlnaHQ9IjQzIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjQiLz48cGF0aCBkPSJNNDkgMy41QzUzLjkzMTUgMy41IDU4LjM2NiA1LjYyODE0IDYxLjQzNTIgOS4wMTYxNiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTQ5LjgyODQgMjZMNDAuODI4NCAxN0wzOCAxOS44Mjg0TDQ4IDI5LjgyODRWNDBINTJWMjkuOTcwNkw2Mi4xNDIxIDE5LjgyODRMNTkuMzEzNyAxN0w1MC4zMTM3IDI2SDQ5LjgyODRaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjgiLz48L2c+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDI1LCA0NCkiPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMCAxOEMwIDguMDU4ODggOC4wNTg4OCAwIDE4IDBIMTEyQzEyMS45NDEgMCAxMzAgOC4wNTg4OCAxMzAgMThWNDUuMTQ4M0MxMzAgNDkuNjgzMSAxMjkuMjI5IDU0LjE4NDggMTI3LjcyIDU4LjQ2MTFMMTEwLjIzOSAxMDcuOTkxQzEwNy42OTkgMTE1LjE4NyAxMDAuODk2IDEyMCA5My4yNjQ3IDEyMEgzNi43MzUzQzI5LjEwMzYgMTIwIDIyLjMwMTQgMTE1LjE4NyAxOS43NjE0IDEwNy45OTFMMi4yODAzOCA1OC40NjExQzAuNzcxMTE3IDU0LjE4NDggMCA0OS42ODMxIDAgNDUuMTQ4M0wwIDE4WiIgZmlsbD0iIzAwNzZERSIvPjxtYXNrIGlkPSJmYWNlU3F1YXJlMDNNYXNrMCIgbWFzay10eXBlPSJhbHBoYSIgbWFza1VuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeD0iMCIgeT0iMCIgd2lkdGg9IjEzMCIgaGVpZ2h0PSIxMjAiPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMCAxOEMwIDguMDU4ODggOC4wNTg4OCAwIDE4IDBIMTEyQzEyMS45NDEgMCAxMzAgOC4wNTg4OCAxMzAgMThWNDUuMTQ4M0MxMzAgNDkuNjgzMSAxMjkuMjI5IDU0LjE4NDggMTI3LjcyIDU4LjQ2MTFMMTEwLjIzOSAxMDcuOTkxQzEwNy42OTkgMTE1LjE4NyAxMDAuODk2IDEyMCA5My4yNjQ3IDEyMEgzNi43MzUzQzI5LjEwMzYgMTIwIDIyLjMwMTQgMTE1LjE4NyAxOS43NjE0IDEwNy45OTFMMi4yODAzOCA1OC40NjExQzAuNzcxMTE3IDU0LjE4NDggMCA0OS42ODMxIDAgNDUuMTQ4M0wwIDE4WiIgZmlsbD0id2hpdGUiLz48L21hc2s+PGcgbWFzaz0idXJsKCNmYWNlU3F1YXJlMDNNYXNrMCkiPjxyZWN0IHg9Ii0yIiB5PSItMiIgd2lkdGg9IjEzNCIgaGVpZ2h0PSIxMjQiIGZpbGw9IiMwMzlCRTUiLz4gdW5kZWZpbmVkIDwvZz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNTIsIDEyNCkiPjxyZWN0IHg9IjEyIiB5PSIxMiIgd2lkdGg9IjQiIGhlaWdodD0iOCIgcng9IjIiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuNiIvPjxyZWN0IHg9IjM2IiB5PSIxMiIgd2lkdGg9IjQiIGhlaWdodD0iOCIgcng9IjIiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuNiIvPjxyZWN0IHg9IjI0IiB5PSIxMiIgd2lkdGg9IjQiIGhlaWdodD0iOCIgcng9IjIiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuNiIvPjxyZWN0IHg9IjQ4IiB5PSIxMiIgd2lkdGg9IjQiIGhlaWdodD0iOCIgcng9IjIiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuNiIvPjxyZWN0IHg9IjYwIiB5PSIxMiIgd2lkdGg9IjQiIGhlaWdodD0iOCIgcng9IjIiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuNiIvPjwvZz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgzOCwgNzYpIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTIxIDQ1QzI5LjI4NDMgNDUgMzYgMzguMjg0MyAzNiAzMEMzNiAyMS43MTU3IDI5LjI4NDMgMTUgMjEgMTVDMTIuNzE1NyAxNSA2IDIxLjcxNTcgNiAzMEM2IDM4LjI4NDMgMTIuNzE1NyA0NSAyMSA0NVoiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMSIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNODMgNDVDOTEuMjg0MyA0NSA5OCAzOC4yODQzIDk4IDMwQzk4IDIxLjcxNTcgOTEuMjg0MyAxNSA4MyAxNUM3NC43MTU3IDE1IDY4IDIxLjcxNTcgNjggMzBDNjggMzguMjg0MyA3NC43MTU3IDQ1IDgzIDQ1WiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yMSA0MkMyNy42Mjc0IDQyIDMzIDM2LjYyNzQgMzMgMzBDMzMgMjMuMzcyNiAyNy42Mjc0IDE4IDIxIDE4QzE0LjM3MjYgMTggOSAyMy4zNzI2IDkgMzBDOSAzNi42Mjc0IDE0LjM3MjYgNDIgMjEgNDJaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjEiLz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTgzIDQyQzg5LjYyNzQgNDIgOTUgMzYuNjI3NCA5NSAzMEM5NSAyMy4zNzI2IDg5LjYyNzQgMTggODMgMThDNzYuMzcyNiAxOCA3MSAyMy4zNzI2IDcxIDMwQzcxIDM2LjYyNzQgNzYuMzcyNiA0MiA4MyA0MloiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMSIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMjEgMzZDMjQuMzEzNyAzNiAyNyAzMy4zMTM3IDI3IDMwQzI3IDI2LjY4NjMgMjQuMzEzNyAyNCAyMSAyNEMxNy42ODYzIDI0IDE1IDI2LjY4NjMgMTUgMzBDMTUgMzMuMzEzNyAxNy42ODYzIDM2IDIxIDM2WiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC44Ii8+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik04MyAzNkM4Ni4zMTM3IDM2IDg5IDMzLjMxMzcgODkgMzBDODkgMjYuNjg2MyA4Ni4zMTM3IDI0IDgzIDI0Qzc5LjY4NjMgMjQgNzcgMjYuNjg2MyA3NyAzMEM3NyAzMy4zMTM3IDc5LjY4NjMgMzYgODMgMzZaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjgiLz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTIxIDMzQzIyLjY1NjkgMzMgMjQgMzEuNjU2OSAyNCAzMEMyNCAyOC4zNDMxIDIyLjY1NjkgMjcgMjEgMjdDMTkuMzQzMSAyNyAxOCAyOC4zNDMxIDE4IDMwQzE4IDMxLjY1NjkgMTkuMzQzMSAzMyAyMSAzM1oiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuOCIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNODMgMzNDODQuNjU2OSAzMyA4NiAzMS42NTY5IDg2IDMwQzg2IDI4LjM0MzEgODQuNjU2OSAyNyA4MyAyN0M4MS4zNDMxIDI3IDgwIDI4LjM0MzEgODAgMzBDODAgMzEuNjU2OSA4MS4zNDMxIDMzIDgzIDMzWiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC44Ii8+PC9nPjwvZz48L3N2Zz4=',
      icons: {
          icon: {name: 'datdot-app', path: 'https://avatars.dicebear.com/api/pixel-art-neutral/'},
      },
      current: true,
      controls: 'wallet-footer-account',
      theme: accounts_list_theme
  },
  {
      list_name: 'account2',
      address: '0x33e42b0daad81fb86a9d7e5266a835db618988783a3ab3e5a0f0e7f2010cccdab',
      // text: 'account2',
      // cover: 'data:image/svg+xml;base64,PHN2ZyB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMTgwIDE4MCI+PG1ldGFkYXRhPjxyZGY6UkRGPjxjYzpXb3JrPjxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PjxkYzp0eXBlIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiLz48ZGM6dGl0bGU+Qm90dHRzPC9kYzp0aXRsZT48ZGM6Y3JlYXRvcj48Y2M6QWdlbnQ+PGRjOnRpdGxlPlBhYmxvIFN0YW5sZXk8L2RjOnRpdGxlPjwvY2M6QWdlbnQ+PC9kYzpjcmVhdG9yPjxkYzpzb3VyY2U+aHR0cHM6Ly9ib3R0dHMuY29tLzwvZGM6c291cmNlPjxjYzpsaWNlbnNlIHJkZjpyZXNvdXJjZT0iaHR0cHM6Ly9ib3R0dHMuY29tLyIvPjxkYzpjb250cmlidXRvcj48Y2M6QWdlbnQ+PGRjOnRpdGxlPkZsb3JpYW4gS8O2cm5lcjwvZGM6dGl0bGU+PC9jYzpBZ2VudD48L2RjOmNvbnRyaWJ1dG9yPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48bWFzayBpZD0iYXZhdGFyc1JhZGl1c01hc2siPjxyZWN0IHdpZHRoPSIxODAiIGhlaWdodD0iMTgwIiByeD0iMCIgcnk9IjAiIHg9IjAiIHk9IjAiIGZpbGw9IiNmZmYiLz48L21hc2s+PGcgbWFzaz0idXJsKCNhdmF0YXJzUmFkaXVzTWFzaykiPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsIDY2KSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xNC45ODA5IDIwLjkxNDFDMTQgMjIuODM5MyAxNCAyNS4zNTk1IDE0IDMwLjRWNDUuNkMxNCA1MC42NDA1IDE0IDUzLjE2MDcgMTQuOTgwOSA1NS4wODU5QzE1Ljg0MzggNTYuNzc5NCAxNy4yMjA2IDU4LjE1NjIgMTguOTE0MSA1OS4wMTkxQzIwLjgzOTMgNjAgMjMuMzU5NSA2MCAyOC40IDYwSDM1LjZDNDAuNjQwNSA2MCA0My4xNjA3IDYwIDQ1LjA4NTkgNTkuMDE5MUM0Ni43Nzk0IDU4LjE1NjIgNDguMTU2MiA1Ni43Nzk0IDQ5LjAxOTEgNTUuMDg1OUM1MCA1My4xNjA3IDUwIDUwLjY0MDUgNTAgNDUuNlYzMC40QzUwIDI1LjM1OTUgNTAgMjIuODM5MyA0OS4wMTkxIDIwLjkxNDFDNDguMTU2MiAxOS4yMjA2IDQ2Ljc3OTQgMTcuODQzOCA0NS4wODU5IDE2Ljk4MDlDNDMuMTYwNyAxNiA0MC42NDA1IDE2IDM1LjYgMTZIMjguNEMyMy4zNTk1IDE2IDIwLjgzOTMgMTYgMTguOTE0MSAxNi45ODA5QzE3LjIyMDYgMTcuODQzOCAxNS44NDM4IDE5LjIyMDYgMTQuOTgwOSAyMC45MTQxWk0xMzAuOTgxIDIwLjkxNDFDMTMwIDIyLjgzOTMgMTMwIDI1LjM1OTUgMTMwIDMwLjRWNDUuNkMxMzAgNTAuNjQwNSAxMzAgNTMuMTYwNyAxMzAuOTgxIDU1LjA4NTlDMTMxLjg0NCA1Ni43Nzk0IDEzMy4yMjEgNTguMTU2MiAxMzQuOTE0IDU5LjAxOTFDMTM2LjgzOSA2MCAxMzkuMzYgNjAgMTQ0LjQgNjBIMTUxLjZDMTU2LjY0IDYwIDE1OS4xNjEgNjAgMTYxLjA4NiA1OS4wMTkxQzE2Mi43NzkgNTguMTU2MiAxNjQuMTU2IDU2Ljc3OTQgMTY1LjAxOSA1NS4wODU5QzE2NiA1My4xNjA3IDE2NiA1MC42NDA1IDE2NiA0NS42VjMwLjRDMTY2IDI1LjM1OTUgMTY2IDIyLjgzOTMgMTY1LjAxOSAyMC45MTQxQzE2NC4xNTYgMTkuMjIwNiAxNjIuNzc5IDE3Ljg0MzggMTYxLjA4NiAxNi45ODA5QzE1OS4xNjEgMTYgMTU2LjY0IDE2IDE1MS42IDE2SDE0NC40QzEzOS4zNiAxNiAxMzYuODM5IDE2IDEzNC45MTQgMTYuOTgwOUMxMzMuMjIxIDE3Ljg0MzggMTMxLjg0NCAxOS4yMjA2IDEzMC45ODEgMjAuOTE0MVoiIGZpbGw9IiMwMDc2REUiLz48bWFzayBpZD0ic2lkZXNTcXVhcmVNYXNrMCIgbWFzay10eXBlPSJhbHBoYSIgbWFza1VuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeD0iMTQiIHk9IjE2IiB3aWR0aD0iMTUyIiBoZWlnaHQ9IjQ0Ij48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE0Ljk4MDkgMjAuOTE0MUMxNCAyMi44MzkzIDE0IDI1LjM1OTUgMTQgMzAuNFY0NS42QzE0IDUwLjY0MDUgMTQgNTMuMTYwNyAxNC45ODA5IDU1LjA4NTlDMTUuODQzOCA1Ni43Nzk0IDE3LjIyMDYgNTguMTU2MiAxOC45MTQxIDU5LjAxOTFDMjAuODM5MyA2MCAyMy4zNTk1IDYwIDI4LjQgNjBIMzUuNkM0MC42NDA1IDYwIDQzLjE2MDcgNjAgNDUuMDg1OSA1OS4wMTkxQzQ2Ljc3OTQgNTguMTU2MiA0OC4xNTYyIDU2Ljc3OTQgNDkuMDE5MSA1NS4wODU5QzUwIDUzLjE2MDcgNTAgNTAuNjQwNSA1MCA0NS42VjMwLjRDNTAgMjUuMzU5NSA1MCAyMi44MzkzIDQ5LjAxOTEgMjAuOTE0MUM0OC4xNTYyIDE5LjIyMDYgNDYuNzc5NCAxNy44NDM4IDQ1LjA4NTkgMTYuOTgwOUM0My4xNjA3IDE2IDQwLjY0MDUgMTYgMzUuNiAxNkgyOC40QzIzLjM1OTUgMTYgMjAuODM5MyAxNiAxOC45MTQxIDE2Ljk4MDlDMTcuMjIwNiAxNy44NDM4IDE1Ljg0MzggMTkuMjIwNiAxNC45ODA5IDIwLjkxNDFaTTEzMC45ODEgMjAuOTE0MUMxMzAgMjIuODM5MyAxMzAgMjUuMzU5NSAxMzAgMzAuNFY0NS42QzEzMCA1MC42NDA1IDEzMCA1My4xNjA3IDEzMC45ODEgNTUuMDg1OUMxMzEuODQ0IDU2Ljc3OTQgMTMzLjIyMSA1OC4xNTYyIDEzNC45MTQgNTkuMDE5MUMxMzYuODM5IDYwIDEzOS4zNiA2MCAxNDQuNCA2MEgxNTEuNkMxNTYuNjQgNjAgMTU5LjE2MSA2MCAxNjEuMDg2IDU5LjAxOTFDMTYyLjc3OSA1OC4xNTYyIDE2NC4xNTYgNTYuNzc5NCAxNjUuMDE5IDU1LjA4NTlDMTY2IDUzLjE2MDcgMTY2IDUwLjY0MDUgMTY2IDQ1LjZWMzAuNEMxNjYgMjUuMzU5NSAxNjYgMjIuODM5MyAxNjUuMDE5IDIwLjkxNDFDMTY0LjE1NiAxOS4yMjA2IDE2Mi43NzkgMTcuODQzOCAxNjEuMDg2IDE2Ljk4MDlDMTU5LjE2MSAxNiAxNTYuNjQgMTYgMTUxLjYgMTZIMTQ0LjRDMTM5LjM2IDE2IDEzNi44MzkgMTYgMTM0LjkxNCAxNi45ODA5QzEzMy4yMjEgMTcuODQzOCAxMzEuODQ0IDE5LjIyMDYgMTMwLjk4MSAyMC45MTQxWiIgZmlsbD0id2hpdGUiLz48L21hc2s+PGcgbWFzaz0idXJsKCNzaWRlc1NxdWFyZU1hc2swKSI+PHJlY3Qgd2lkdGg9IjE4MCIgaGVpZ2h0PSI3NiIgZmlsbD0iI0ZGNzA0MyIvPjxyZWN0IHk9IjM4IiB3aWR0aD0iMTgwIiBoZWlnaHQ9IjM4IiBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIwLjEiLz48L2c+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQxLCAwKSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik01MCAxM0MzOC45NTQzIDEzIDMwIDIxLjk1NDMgMzAgMzNWMzZIMjFDMjAuNDQ3NyAzNiAyMCAzNi40NDc3IDIwIDM3VjUxQzIwIDUxLjU1MjMgMjAuNDQ3NyA1MiAyMSA1Mkg3OUM3OS41NTIzIDUyIDgwIDUxLjU1MjMgODAgNTFWMzdDODAgMzYuNDQ3NyA3OS41NTIzIDM2IDc5IDM2SDcwVjMzQzcwIDIxLjk1NDMgNjEuMDQ1NyAxMyA1MCAxM1oiIGZpbGw9IiM1OUM0RkYiLz48bWFzayBpZD0idG9wQnVsYjAxTWFzazAiIG1hc2stdHlwZT0iYWxwaGEiIG1hc2tVbml0cz0idXNlclNwYWNlT25Vc2UiIHg9IjIwIiB5PSIxMyIgd2lkdGg9IjYwIiBoZWlnaHQ9IjM5Ij48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTUwIDEzQzM4Ljk1NDMgMTMgMzAgMjEuOTU0MyAzMCAzM1YzNkgyMUMyMC40NDc3IDM2IDIwIDM2LjQ0NzcgMjAgMzdWNTFDMjAgNTEuNTUyMyAyMC40NDc3IDUyIDIxIDUySDc5Qzc5LjU1MjMgNTIgODAgNTEuNTUyMyA4MCA1MVYzN0M4MCAzNi40NDc3IDc5LjU1MjMgMzYgNzkgMzZINzBWMzNDNzAgMjEuOTU0MyA2MS4wNDU3IDEzIDUwIDEzWiIgZmlsbD0id2hpdGUiLz48L21hc2s+PGcgbWFzaz0idXJsKCN0b3BCdWxiMDFNYXNrMCkiPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iNTIiIGZpbGw9IiNGRjcwNDMiLz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTUwIDM2QzUyLjIwOTEgMzYgNTQgMzUuMDI4IDU0IDMxLjcxNDNDNTQgMjguNDAwNiA1Mi4yMDkxIDI0IDUwIDI0QzQ3Ljc5MDkgMjQgNDYgMjguNDAwNiA0NiAzMS43MTQzQzQ2IDM1LjAyOCA0Ny43OTA5IDM2IDUwIDM2WiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC42Ii8+PHJlY3QgeD0iMjAiIHk9IjEzIiB3aWR0aD0iNjAiIGhlaWdodD0iMjMiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuNCIvPjxwYXRoIGQ9Ik01MCAxNC41QzQ5LjQ0NzcgMTQuNSA0OSAxNC45NDc3IDQ5IDE1LjVDNDkgMTYuMDUyMyA0OS40NDc3IDE2LjUgNTAgMTYuNVYxNC41Wk02MS42OTQxIDIxLjY4NzVDNjIuMDY0OSAyMi4wOTY4IDYyLjY5NzMgMjIuMTI4MSA2My4xMDY2IDIxLjc1NzNDNjMuNTE1OSAyMS4zODY1IDYzLjU0NzEgMjAuNzU0MSA2My4xNzYzIDIwLjM0NDhMNjEuNjk0MSAyMS42ODc1Wk02NS43NTk1IDI0LjA0NzNDNjUuNTAzNSAyMy41NTc5IDY0Ljg5OTMgMjMuMzY4NiA2NC40MDk5IDIzLjYyNDZDNjMuOTIwNSAyMy44ODA2IDYzLjczMTMgMjQuNDg0OCA2My45ODczIDI0Ljk3NDJMNjUuNzU5NSAyNC4wNDczWk02NS40MjQ4IDI4Ljk1NTlDNjUuNTQwNCAyOS40OTU5IDY2LjA3MTkgMjkuODQgNjYuNjExOSAyOS43MjQ0QzY3LjE1MiAyOS42MDg4IDY3LjQ5NjEgMjkuMDc3MyA2Ny4zODA1IDI4LjUzNzNMNjUuNDI0OCAyOC45NTU5Wk01MCAxNi41QzU0LjYzNzUgMTYuNSA1OC44MDY1IDE4LjQ5OTkgNjEuNjk0MSAyMS42ODc1TDYzLjE3NjMgMjAuMzQ0OEM1OS45MjU2IDE2Ljc1NjMgNTUuMjI1NiAxNC41IDUwIDE0LjVWMTYuNVpNNjMuOTg3MyAyNC45NzQyQzY0LjYzNTcgMjYuMjEzOSA2NS4xMjM5IDI3LjU1MDEgNjUuNDI0OCAyOC45NTU5TDY3LjM4MDUgMjguNTM3M0M2Ny4wNDExIDI2Ljk1MTggNjYuNDkwNCAyNS40NDQ4IDY1Ljc1OTUgMjQuMDQ3M0w2My45ODczIDI0Ljk3NDJaIiBmaWxsPSJ3aGl0ZSIvPjwvZz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjUsIDQ0KSI+PHJlY3Qgd2lkdGg9IjEzMCIgaGVpZ2h0PSIxMjAiIHJ4PSIxOCIgZmlsbD0iIzAwNzZERSIvPjxtYXNrIGlkPSJmYWNlU3F1YXJlMDFNYXNrMCIgbWFzay10eXBlPSJhbHBoYSIgbWFza1VuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeD0iMCIgeT0iMCIgd2lkdGg9IjEzMCIgaGVpZ2h0PSIxMjAiPjxyZWN0IHdpZHRoPSIxMzAiIGhlaWdodD0iMTIwIiByeD0iMTgiIGZpbGw9IndoaXRlIi8+PC9tYXNrPjxnIG1hc2s9InVybCgjZmFjZVNxdWFyZTAxTWFzazApIj48cmVjdCB4PSItMiIgeT0iLTIiIHdpZHRoPSIxMzQiIGhlaWdodD0iMTI0IiBmaWxsPSIjRjQ1MTFFIi8+IHVuZGVmaW5lZCA8L2c+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDUyLCAxMjQpIj48cmVjdCB4PSIxMiIgeT0iMTIiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIHJ4PSIyIiBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIwLjYiLz48cmVjdCB4PSIzNiIgeT0iMTIiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIHJ4PSIyIiBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIwLjYiLz48cmVjdCB4PSIyNCIgeT0iMTIiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIHJ4PSIyIiBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIwLjYiLz48cmVjdCB4PSI0OCIgeT0iMTIiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIHJ4PSIyIiBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIwLjYiLz48cmVjdCB4PSI2MCIgeT0iMTIiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIHJ4PSIyIiBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIwLjYiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzgsIDc2KSI+PHJlY3QgeT0iNCIgd2lkdGg9IjEwNCIgaGVpZ2h0PSI0MiIgcng9IjQiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuOCIvPjxyZWN0IHg9IjI4IiB5PSIyNSIgd2lkdGg9IjEwIiBoZWlnaHQ9IjExIiByeD0iMiIgZmlsbD0iIzhCRERGRiIvPjxyZWN0IHg9IjY2IiB5PSIyNSIgd2lkdGg9IjEwIiBoZWlnaHQ9IjExIiByeD0iMiIgZmlsbD0iIzhCRERGRiIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMjEgNEgyOUwxMiA0Nkg0TDIxIDRaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjQiLz48L2c+PC9nPjwvc3ZnPg==',
      icons: {
          icon: {name: 'robot', path},
      },
      current: false,
      controls: 'wallet-footer-account',
      theme: accounts_list_theme
  },
  {
      list_name: 'account3',
      address: '0x2f60dd41059136ca6a1d7dcaa86eb350bcd6f7453dc248f2477d80418456762df',
      // text: 'account3',
      // cover: `${path}/developer.svg`,
      icons: {
          icon: {name: 'developer', path},
      },
      current: false,
      controls: 'wallet-footer-account',
      theme: accounts_list_theme
  },
  {
      list_name: 'account4',
      address: '0x261d34a06b681ae33795b604a1cb712de1c813eb7844bf5129d15328066817c65',
      // text: 'account1',
      // cover: `${path}/ai.svg`,
      icons: {
          icon: {name: 'ai', path},
      },
      current: false,
      controls: 'wallet-footer-account',
      theme: accounts_list_theme
  },
  {
      list_name: 'account5',
      address: '021a93595b8eefac4d5fa85fc749a244ebc5ee6f3a121c06ecb24d3bca177c38b0',
      // text: 'account2',
      // cover: `${path}/flower.svg`,
      icons: {
          icon: {name: 'flower', path},
      },
      current: false,
      controls: 'wallet-footer-account',
      theme: accounts_list_theme
  },
  {
      list_name: 'account6',
      address: '0x3e625b740161e0e285c4bb29de128beed64ca742c02b143aa7930e191689c40fb',
      // text: 'account3',
      // cover: `${path}/marine.svg`,
      icons: {
          icon: {name: 'marine', path},
      },
      current: false,
      controls: 'wallet-footer-account',
      theme: accounts_list_theme
  }
]

function wallet () {
  const nav_option = [
    {
        name: 'user',
        body: 'USER',
        current: false,
    },
    {
        name: 'plans',
        body: 'PLANS',
        current: true
    },
    {
        name: 'jobs',
        body: 'JOBS',
    },
    {
        name: 'apps',
        body: 'APPS',
        disabled: true,
    }
  ]

  const status = {
    activities: 12345,
    plan: '19v8cMTwMjYvVQgtmZo91gxagp43Pv7XSc'
  }

  function widget () {
    const recipients = []
    const make = message_maker('datdot-wallet')
    const el = make_element({name: 'main', classlist: 'wrap'})
    const shadow = el.attachShadow({mode: 'closed'})
    const container = i_container({name: 'wallet-container'}, protocol('wallet-container'))
    const footer = i_footer({name: 'wallet-footer', body: { nav: nav_option, accounts: accounts_option, status }, to: 'wallet-container'}, protocol('wallet-footer'))
    style_sheet(shadow, style)
    shadow.append(container, footer)

    if (accounts_option.length > 0) handle_account_init(accounts_option)
    
    return el

    function handle_account_init(args) {
      const result = args.filter( obj => obj.current)[0]
      recipients['wallet-footer']( make({type: 'account-changed', data: result}) )
    }

    function handle_change_account({from, data, args}) {
      const arr = [...args]
      arr.map( obj => {
        obj.current = obj.list_name === data.name
        if (obj.current) return recipients[from]( make({type: 'account-changed', data: obj}) )
      })
      return accounts_option = args
    }
    function protocol (name) {
      return send => {
        recipients[name] = send
        return get
      }
    }
    function get (msg) {
      const {head, type, refs, meta, data} = msg
      const from = head[0].split(' / ')[0]
      const to = head[1]
      if (type.match(/ready/)) return 
      if (type.match(/click/)) return
      if (type.match(/switch-page/)) return recipients['wallet-container'](make({type: 'load-page', data}))
      if (type.match(/switch-account/)) return handle_change_account({from, data, args: accounts_option})
      if (type.match(/selected/)) return console.log(from, data)
    }
  }

  let style = `
  :host(.wrap) {
    display: grid;
    ${make_grid({
      rows: 'repeat(auto-fit, minmax(0, 100%))',
      areas: ['container', 'nav']
    })}
    height: 100%;
  }
  i-container {
    grid-area: container;
  }
  i-nav {
    grid-area: nav;
  }
  `
  return widget()
}