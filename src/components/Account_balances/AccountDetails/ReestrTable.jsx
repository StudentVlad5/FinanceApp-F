import React, { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  TablePagination,
  Autocomplete,
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddTaskIcon from '@mui/icons-material/AddTask';
import { useSelector } from 'react-redux';
import moment from 'moment/moment';
import { theme } from 'components/baseStyles/Variables.styled';
import { useParams } from 'react-router-dom';

const columns = [
  { id: 'RE_ID', label: 'RE_ID' },
  { id: 'RE_TRANS_SCH_ID', label: 'RE_TRANS_SCH_ID' },
  { id: 'RE_DATE', label: 'RE_DATE' },
  { id: 'RE_KOMENT', label: 'RE_KOMENT' },
  { id: 'RE_PAYE_ID', label: 'RE_PAYE_ID' },
  { id: 'RE_CAT_ID', label: 'RE_CAT_ID' },
  { id: 'RE_MONEY', label: 'RE_MONEY' },
  // { id: 'RE_TRANS_RE', label: 'RE_TRANS_RE' },
  { id: 'RE_TOTAL', label: 'RE_TOTAL' },
  { id: 'RE_KURS', label: 'RE_KURS' },
  { id: 'RE_TAG', label: 'RE_TAG' },
];

const ReestrTable = ({ data, onSave, onDelete, setAccountData }) => {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [groupAccounts, setGroupAccounts] = useState([]);
  const [groupContragents, setGroupContragents] = useState([]);
  const [groupCategories, setGroupCategories] = useState(null);
  const [add, setAdd] = useState(false);

  const { items: accounts } = useSelector((state) => state.accounts);
  const { items: categories } = useSelector((state) => state.categories);
  const { items: contragents } = useSelector((state) => state.contragents);
  const { items: currency } = useSelector((state) => state.currency);
  const { items: tags } = useSelector((state) => state.tags);
  const { id } = useParams();
  const accountOptions = [...accounts, { SCH_ID: '-1', SCH_NAME: 'Прибуток/витрати' }];

  const currencyMap = useMemo(() => {
    const map = {};
    currency.forEach((it) => {
      map[it?.CUR_ID] = it?.CUR_SHOT_NAME_US;
    });
    return map;
  }, [currency]);

  const accountMap = useMemo(() => {
    const map = {};
    accounts.forEach((it) => {
      map[it?.SCH_ID] = it?.SCH_CUR;
    });
    return map;
  }, [accounts]);

  useEffect(() => {
    const createGroupCategories = categories.reduce((acc, category) => {
      if (category.CAT0_ID) {
        acc[category.CAT0_ID] = category.CAT0_NAME;
      }
      return acc;
    }, {});
    if (createGroupCategories) {
      setGroupCategories(createGroupCategories);
    }

    const createGroupContragents = contragents.reduce((acc, contragent) => {
      if (contragent.PAYEE_ID) {
        acc[contragent.PAYEE_ID] = contragent.PAYEE_NAME;
      }
      return acc;
    }, {});
    if (createGroupContragents) {
      setGroupContragents(createGroupContragents);
    }
  }, [categories, contragents]);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const total = data.reduce((acc, account) => {
      const amount = Number(account.RE_MONEY);
      return acc + (isNaN(amount) ? 0 : amount);
    }, 0);

    const groupAccounts = accounts.reduce((acc, account) => {
      if (account.SCH_ID) {
        acc[account.SCH_ID] = account.SCH_NAME;
      }
      return acc;
    }, {});
    if (groupAccounts) setGroupAccounts(groupAccounts);
    const accountName = groupAccounts[data[0]?.RE_SCH_ID] || 'Доходи/витрати';

    const accountCurrency = currencyMap[accountMap[data[0]?.RE_SCH_ID]] || 'UAH';

    // Зберігаємо у вигляді масиву об'єктів
    setAccountData([{ name: accountName, total, currency: accountCurrency }]);
  }, [accounts, data, setAccountData, currencyMap, accountMap]);

  // пагінація
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // обробник пагінації
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Формат виводу
  const displayFormat = 'DD-MM-YYYY';

  //  Новий запис
  const [createNewItem, setCreateNewItem] = useState({
    RE_ID: Date.now() + Math.floor(Math.random() * 1000),
    RE_TRANS_SCH_ID: '',
    RE_DATE: '',
    RE_KOMENT: '',
    RE_PAYE_ID: '',
    RE_CAT_ID: '',
    RE_MONEY: '',
    RE_TRANS_RE: '',
    RE_KURS: 1,
    RE_TAG: '',
    RE_SCH_ID: id,
  });

  // Стан фільтрів - ключі співпадають з id колонок
  const [filters, setFilters] = useState({
    RE_ID: '',
    RE_TRANS_SCH_ID: '',
    RE_DATE: '',
    RE_KOMENT: '',
    RE_PAYE_ID: '',
    RE_CAT_ID: '',
    RE_MONEY: '',
    RE_TRANS_RE: '',
    RE_KURS: '',
    RE_TAG: '',
  });

  // Обробник зміни фільтрів
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Сортування за датою (від новішої)
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => new Date(a.RE_DATE) - new Date(b.RE_DATE));
  }, [data]);
  // змінюємо візуалізацію
  const formatMoney = (value) => {
    if (typeof value === 'string') {
      // Якщо значення - рядок, то заміняємо кому на крапку і перетворюємо в число
      return parseFloat(value.replace(',', '.').replace(' ', '')) || 0;
    }
    // Якщо значення вже число, просто повертаємо його
    return (
      value
        .toFixed(2)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
        .replace('.', ',') || 0
    );
  };

  const formattedData = useMemo(() => {
    let runningBalance = 0;

    const enriched = sortedData.map((item) => {
      const money = formatMoney(item.RE_MONEY); // Перетворюємо в число
      runningBalance += money;
      return {
        ...item,
        RE_TOTAL: runningBalance, // Обчислюємо сальдо
      };
    });

    const withFormatting = enriched.map((item) => ({
      ...item,
      RE_MONEY: formatMoney(item.RE_MONEY), // Перетворення для відображення в таблиці
      RE_TOTAL: formatMoney(item.RE_TOTAL), // Для відображення з точністю до двох знаків
      RE_DATE: moment(item.RE_DATE).format(displayFormat),
      DATE: item.RE_DATE,
      RE_TRANS_SCH_ID: groupAccounts[item.RE_TRANS_SCH_ID] || 'Прибуток/збиток',
      RE_CAT_ID: groupCategories[item.RE_CAT_ID],
      RE_PAYE_ID: groupContragents[item.RE_PAYE_ID],
    }));

    return withFormatting;
  }, [groupAccounts, groupCategories, groupContragents, sortedData]);

  // Фільтрація даних по всіх фільтрах
  const filteredData = useMemo(() => {
    return formattedData
      .sort((a, b) => new Date(b.DATE) - new Date(a.DATE))
      .filter((item) => {
        return columns.every(({ id }) => {
          const filterValue = (filters[id] || '').toString().toLowerCase().trim();
          const itemValue = item[id];

          if (!filterValue) return true;
          if (itemValue === undefined || itemValue === null) return false;

          return String(itemValue).toLowerCase().includes(filterValue);
        });
      });
  }, [filters, formattedData]);

  // обмеження виведення рядків
  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleEditClick = (item) => {
    const originalItem = data.find((el) => el._id === item._id);
    if (originalItem) {
      setEditingItem({ ...originalItem });
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingItem(null);
    setAdd(false);
    setCreateNewItem({
      RE_ID: Date.now() + Math.floor(Math.random() * 1000),
      RE_TRANS_SCH_ID: '',
      RE_DATE: '',
      RE_KOMENT: '',
      RE_PAYE_ID: '',
      RE_CAT_ID: '',
      RE_MONEY: '',
      RE_TRANS_RE: Date.now() + Math.floor(Math.random() * 1000) + 1,
      RE_KURS: '',
      RE_TAG: '',
      RE_SCH_ID: id,
    });
  };

  console.log('createNewItem', createNewItem);
  const handleCreate = (e) => {
    const { name, value } = e.target;
    setCreateNewItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditingItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(editingItem);
    handleClose();
  };

  const handleSaveCreate = () => {
    onSave(createNewItem, 'create');
    handleClose();
  };

  const handleDelete = (item) => {
    if (window.confirm(`Видалити запис RE_ID: ${item._id}?`)) {
      onDelete(item._id);
    }
  };

  return (
    <>
      <AddTaskIcon sx={{ m: 1.5, cursor: 'pointer' }} onClick={() => setAdd((prev) => !prev)} />
      <TableContainer component={Paper}>
        <Table size='small' stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map(({ id, label }) => (
                <TableCell key={id}>
                  {label}
                  <TextField
                    variant='standard'
                    size='small'
                    name={id}
                    value={filters[id]}
                    onChange={handleFilterChange}
                    placeholder='Пошук...'
                    fullWidth
                    sx={{ mt: 0.5 }}
                  />
                </TableCell>
              ))}
              <TableCell align='center'>Дії</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((formattedRow) => (
              <TableRow
                key={formattedRow._id}
                sx={{
                  '&:nth-of-type(even)': {
                    backgroundColor: theme.colors.fon, // світло-сірий
                  },
                  '&:hover': {
                    backgroundColor: theme.colors.accent, // блідо-блакитний при наведенні
                    cursor: 'pointer',
                  },
                }}
              >
                {columns.map(({ id }) => (
                  <TableCell key={id}>{formattedRow[id]}</TableCell>
                ))}
                <TableCell align='center'>
                  <IconButton
                    aria-label='edit'
                    onClick={() => handleEditClick(formattedRow)}
                    size='small'
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    aria-label='delete'
                    onClick={() => handleDelete(formattedRow)}
                    size='small'
                    color='error'
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredData.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} align='center'>
                  Дані не знайдені
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component='div'
        count={filteredData.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
      {/* Модальне вікно редагування */}
      <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
        <DialogTitle>Редагувати запис RE_ID: {editingItem?.RE_ID}</DialogTitle>
        <DialogContent dividers>
          {editingItem && (
            <>
              <TextField
                margin='dense'
                label='RE_ID'
                type='number'
                fullWidth
                name='RE_ID'
                value={editingItem.RE_ID}
                onChange={handleChange}
                disabled
              />
              <TextField
                margin='dense'
                label='RE_SCH_ID'
                type='number'
                fullWidth
                name='RE_SCH_ID'
                value={editingItem.RE_SCH_ID}
                onChange={handleChange}
              />
              <TextField
                margin='dense'
                label='RE_DATE'
                type='date'
                fullWidth
                name='RE_DATE'
                value={editingItem.RE_DATE}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                margin='dense'
                label='RE_KOMENT'
                type='text'
                fullWidth
                name='RE_KOMENT'
                value={editingItem.RE_KOMENT}
                onChange={handleChange}
              />
              <TextField
                margin='dense'
                label='RE_PAYE_ID'
                type='number'
                fullWidth
                name='RE_PAYE_ID'
                value={editingItem.RE_PAYE_ID}
                onChange={handleChange}
              />
              <TextField
                margin='dense'
                label='RE_CAT_ID'
                type='number'
                fullWidth
                name='RE_CAT_ID'
                value={editingItem.RE_CAT_ID}
                onChange={handleChange}
              />
              <TextField
                margin='dense'
                label='RE_MONEY'
                type='number'
                fullWidth
                name='RE_MONEY'
                value={editingItem.RE_MONEY}
                onChange={handleChange}
              />
              <TextField
                margin='dense'
                label='RE_TRANS_RE'
                type='number'
                fullWidth
                name='RE_TRANS_RE'
                value={editingItem.RE_TRANS_RE}
                onChange={handleChange}
              />
              <TextField
                margin='dense'
                label='RE_KURS'
                type='text'
                fullWidth
                name='RE_KURS'
                value={editingItem.RE_KURS}
                onChange={handleChange}
              />
              <TextField
                margin='dense'
                label='RE_TAG'
                type='text'
                fullWidth
                name='RE_TAG'
                value={editingItem.RE_TAG}
                onChange={handleChange}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Відмінити</Button>
          <Button variant='contained' onClick={handleSave} color='primary'>
            Зберегти
          </Button>
        </DialogActions>
      </Dialog>
      {/* Модальне вікно створення нового запису */}
      <Dialog
        open={add}
        onClose={() => {
          setAdd(false);
        }}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Створити новий запис RE_ID: {createNewItem?.RE_ID}</DialogTitle>
        <DialogContent dividers>
          {createNewItem && (
            <>
              <TextField
                margin='dense'
                label='RE_ID'
                type='number'
                fullWidth
                name='RE_ID'
                value={createNewItem.RE_ID}
                onChange={handleCreate}
                disabled
              />
              <TextField
                margin='dense'
                label='RE_DATE'
                type='date'
                fullWidth
                name='RE_DATE'
                value={createNewItem.RE_DATE}
                onChange={handleCreate}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                margin='dense'
                label='RE_KOMENT'
                type='text'
                fullWidth
                name='RE_KOMENT'
                value={createNewItem.RE_KOMENT}
                onChange={handleCreate}
              />
              <Autocomplete
                options={categories}
                value={
                  categories.find((option) => option.CAT0_ID === createNewItem.RE_CAT_ID) || null
                }
                onChange={(e, newValue) => {
                  setCreateNewItem((prev) => ({
                    ...prev,
                    RE_CAT_ID: newValue ? newValue.CAT0_ID : '',
                  }));
                }}
                getOptionLabel={(option) => option.CAT0_NAME}
                isOptionEqualToValue={(option, value) => option.CAT0_ID === value.CAT0_ID}
                renderOption={(props, option) => (
                  <li {...props} key={option.CAT0_ID}>
                    {option.CAT0_NAME}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField {...params} label='RE_CAT_ID' margin='dense' fullWidth />
                )}
              />
              <Autocomplete
                options={contragents}
                value={
                  contragents.find((option) => option.PAYEE_ID === createNewItem.RE_PAYE_ID) || null
                }
                onChange={(e, newValue) => {
                  setCreateNewItem((prev) => ({
                    ...prev,
                    RE_PAYE_ID: newValue ? newValue.PAYEE_ID : '', // ✅ беремо PAYEE_ID
                  }));
                }}
                getOptionLabel={(option) => option.PAYEE_NAME}
                isOptionEqualToValue={(option, value) => option.PAYEE_ID === value.PAYEE_ID} // ✅ однакові ключі
                renderOption={(props, option) => (
                  <li {...props} key={option.PAYEE_ID}>
                    {option.PAYEE_NAME}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField {...params} label='RE_PAYE_ID' margin='dense' fullWidth />
                )}
              />

              <TextField
                margin='dense'
                label='RE_MONEY'
                type='number'
                fullWidth
                name='RE_MONEY'
                value={createNewItem.RE_MONEY}
                onChange={handleCreate}
              />
              <Autocomplete
                options={accountOptions}
                value={
                  accountOptions.find(
                    (option) => option.SCH_ID === createNewItem.RE_TRANS_SCH_ID,
                  ) || null
                }
                onChange={(e, newValue) => {
                  setCreateNewItem((prev) => ({
                    ...prev,
                    RE_TRANS_SCH_ID: newValue ? newValue.SCH_ID : '',
                  }));
                }}
                getOptionLabel={(option) => option.SCH_NAME || ''}
                isOptionEqualToValue={(option, value) => option.SCH_ID === value.SCH_ID}
                renderInput={(params) => (
                  <TextField {...params} label='RE_TRANS_SCH_ID' margin='dense' fullWidth />
                )}
              />
              <TextField
                margin='dense'
                label='RE_KURS'
                type='number'
                fullWidth
                name='RE_KURS'
                value={createNewItem.RE_KURS}
                onChange={handleCreate}
              />
              <Autocomplete
                options={tags}
                value={tags.find((option) => option.TG_NAME === createNewItem.RE_TAG) || null}
                onChange={(e, newValue) => {
                  setCreateNewItem((prev) => ({
                    ...prev,
                    // Замінимо TG_ID на TG_NAME в стані
                    RE_TAG: newValue ? newValue.TG_NAME : '',
                  }));
                }}
                getOptionLabel={(option) => option.TG_NAME}
                isOptionEqualToValue={(option, value) => option.TG_ID === value.TG_ID}
                renderInput={(params) => (
                  <TextField {...params} label='RE_TAG' margin='dense' fullWidth />
                )}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Відмінити</Button>
          <Button variant='contained' onClick={handleSaveCreate} color='primary'>
            Зберегти
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ReestrTable;
