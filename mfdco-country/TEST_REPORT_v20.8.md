# v20.8 Test Report

- JavaScript syntax: 40/40 passed.
- Country list no longer awaits user/session unless `mine=true`.
- Initial create button no longer contains permanent checking text.
- Session client wait timeout: 2500 ms.
- Auth getSession timeout: 3000 ms.
- Profile lookup timeout: 3000 ms.
- Force refresh actually calls refresh(): yes.
- Background auth retry after initial failure: yes.
- SQL change required: no.
