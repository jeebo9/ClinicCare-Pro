const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'data.json');

const readData = () => {
    try {
        const data = fs.readFileSync(DATA_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading data:', err);
        return { patients: [], appointments: [], users: [], invoices: [], insurance: [] };
    }
};

const writeData = (data) => {
    try {
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error('Error writing data:', err);
    }
};

module.exports = {
    getPatients: () => readData().patients,
    addPatient: (patient) => {
        const data = readData();
        data.patients.push(patient);
        writeData(data);
        return patient;
    },
    // Users
    getUsers: () => readData().users,
    addUser: (user) => {
        const data = readData();
        data.users.push(user);
        writeData(data);
        return user;
    },
    updateUserRole: (username, role) => {
        const data = readData();
        const index = data.users.findIndex(u => u.username === username);
        if (index !== -1) {
            data.users[index].role = role;
            writeData(data);
            return data.users[index];
        }
        return null;
    },
    // Invoices
    getInvoices: () => readData().invoices,
    addInvoice: (invoice) => {
        const data = readData();
        data.invoices.push(invoice);
        writeData(data);
        return invoice;
    },
    updateInvoiceStatus: (id, status) => {
        const data = readData();
        const index = data.invoices.findIndex(inv => inv.id === id);
        if (index !== -1) {
            data.invoices[index].status = status;
            writeData(data);
            return data.invoices[index];
        }
        return null;
    },
    getAppointments: () => readData().appointments,
    addAppointment: (appointment) => {
        const data = readData();
        data.appointments.push(appointment);
        writeData(data);
        return appointment;
    },
    updateAppointment: (id, status) => {
        const data = readData();
        const index = data.appointments.findIndex(a => a.id === id);
        if (index !== -1) {
            data.appointments[index].status = status;
            writeData(data);
            return data.appointments[index];
        }
        return null;
    },
    // Insurance
    getInsuranceClaims: () => readData().insurance || [],
    addInsuranceClaim: (claim) => {
        const data = readData();
        if (!data.insurance) data.insurance = [];
        data.insurance.push(claim);
        writeData(data);
        return claim;
    }
};
