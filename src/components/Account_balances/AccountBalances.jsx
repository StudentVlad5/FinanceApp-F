import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getReestr } from '../../redux/reestr/operations';
import { useNavigate } from 'react-router-dom';

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Box,
  TextField,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const formatMoney = (value) => {
  if (typeof value !== 'number' || isNaN(value)) {
    console.warn('formatMoney отримав некоректне значення:', value);
    return '0,00';
  }
  return value
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    .replace('.', ',');
};

const AccountBalances = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, isLoading, error } = useSelector((state) => state.reestr);
  const { items: group } = useSelector((state) => state.group);
  const { items: accounts } = useSelector((state) => state.accounts);
  const { items: currency } = useSelector((state) => state.currency);

  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(getReestr());
  }, [dispatch]);

  const currencyMap = useMemo(() => {
    const map = {};
    currency.forEach((it) => {
      map[it?.CUR_ID] = it?.CUR_SHOT_NAME_US;
    });
    return map;
  }, [currency]);

  const uniqueCurrencies = useMemo(() => {
    const set = new Set();
    accounts.forEach((acc) => set.add(acc.SCH_CUR));
    return Array.from(set).sort((a, b) => a - b);
  }, [accounts]);

  const groupAccounts = accounts.reduce((acc, account) => {
    if (!acc[account.SCH_GROUP]) acc[account.SCH_GROUP] = [];
    acc[account.SCH_GROUP].push(account);
    return acc;
  }, {});

  const groupNameById = group.reduce((acc, g) => {
    acc[g.SCHG_ID] = g.SCHG_NAME;
    return acc;
  }, {});

  const totalMoneyBySchId = items.reduce((acc, item) => {
    console.log('item', item);
    acc[item._id.schId] = item.totalMoney;
    return acc;
  }, {});

  const groupTotals = Object.entries(groupAccounts)
    .map(([groupId, accountsInGroup]) => {
      const accountsFiltered = accountsInGroup
        .map((acc) => {
          const currency = acc.SCH_CUR;
          return {
            id: acc.SCH_ID,
            name: acc.SCH_NAME,
            currency,
            money: totalMoneyBySchId[acc.SCH_ID] || 0,
          };
        })
        .filter((acc) => acc.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => a.money - b.money);

      const totalsByCurrency = accountsFiltered.reduce((totals, acc) => {
        if (!totals[acc.currency]) totals[acc.currency] = 0;
        totals[acc.currency] += acc.money;
        return totals;
      }, {});

      return {
        groupId,
        groupName: groupNameById[groupId] || `Група ${groupId}`,
        totalsByCurrency,
        accounts: accountsFiltered,
      };
    })
    .filter((group) => group.accounts.length > 0);

  const grandTotalsByCurrency = groupTotals.reduce((totals, group) => {
    Object.entries(group.totalsByCurrency).forEach(([currency, amount]) => {
      if (!totals[currency]) totals[currency] = 0;
      totals[currency] += amount;
    });
    return totals;
  }, {});

  return (
    <Paper sx={{ padding: 2 }}>
      <Typography variant='h5' gutterBottom>
        Реєстр
      </Typography>

      <TextField
        label='Пошук по назві рахунку'
        variant='outlined'
        size='small'
        fullWidth
        margin='normal'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {isLoading && <h3>Прошу зачекати, очікуємо на отримання даних</h3>}
      {error && <h3>Отримали помилку: {error}</h3>}

      {groupTotals.map((group) => (
        <Accordion key={group.groupId}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant='subtitle1'>{group.groupName}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {Object.entries(group.totalsByCurrency).map(([curId, amount]) => (
                <Typography key={curId} variant='subtitle1'>
                  <strong>
                    {formatMoney(amount)} {currencyMap[curId] || curId}
                  </strong>
                </Typography>
              ))}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Рахунок (ID)</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Назва</strong>
                  </TableCell>
                  {uniqueCurrencies.map((cur) => (
                    <TableCell key={cur} align='right'>
                      <strong>{currencyMap[cur] || cur}</strong>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {group.accounts.map((acc) => (
                  <TableRow key={acc.id}>
                    <TableCell>{acc.id}</TableCell>
                    <TableCell
                      onClick={() => navigate(`/admin/account_balances/${acc.id}`)}
                      sx={{ cursor: 'pointer', color: 'black' }}
                    >
                      {acc.name}
                    </TableCell>
                    {uniqueCurrencies.map((cur) => (
                      <TableCell key={cur} align='right'>
                        {acc.currency === cur
                          ? `${formatMoney(acc.money)} ${currencyMap[cur]}`
                          : ''}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={2}>
                    <strong>Підсумок</strong>
                  </TableCell>
                  <TableCell align='right'>
                    <strong>{formatMoney(group.totalsByCurrency['980'] || 0)} грн</strong>
                  </TableCell>
                  <TableCell align='right'>
                    <strong>{formatMoney(group.totalsByCurrency['840'] || 0)} $</strong>
                  </TableCell>
                  <TableCell align='right'>
                    <strong>{formatMoney(group.totalsByCurrency['978'] || 0)} €</strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </AccordionDetails>
        </Accordion>
      ))}

      <Typography
        variant='h6'
        align='right'
        sx={{ mt: 4, display: 'flex', gap: 4, justifyContent: 'flex-end' }}
      >
        Загальна сума:
        <strong> {formatMoney(grandTotalsByCurrency['840'] || 0)} $</strong>
        <strong> {formatMoney(grandTotalsByCurrency['978'] || 0)} €</strong>
        <strong> {formatMoney(grandTotalsByCurrency['980'] || 0)} грн</strong>
      </Typography>
    </Paper>
  );
};

export default AccountBalances;
