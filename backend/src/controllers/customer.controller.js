const customerService = require("../services/customer.service");

async function createCustomer(req, res) {
    try {
        const {
            company_name,
            contact_name,
            email
        } = req.body;

        if (!company_name || !contact_name || !email) {
            return res.status(400).json({
                success: false,
                message: "company_name, contact_name and email are required"
            });
        }

        const customer = await customerService.createCustomer(req.body);

        res.status(201).json({
            success: true,
            message: "Customer created successfully",
            data: customer
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to create customer",
            error: error.message
        });
    }
}

async function getAllCustomers( res) {
    try {
        const customers = await customerService.getAllCustomers();

        res.json({
            success: true,
            data: customers
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch customers"
        });
    }
}

async function getCustomerById(req, res) {
    try {
        const customer = await customerService.getCustomerById(
            req.params.id
        );

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        res.json({
            success: true,
            data: customer
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch customer"
        });
    }
}

async function updateCustomer(req, res) {
    try {
        const customer = await customerService.updateCustomer(
            req.params.id,
            req.body
        );

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        res.json({
            success: true,
            message: "Customer updated successfully",
            data: customer
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to update customer",
            error: error.message
        });
    }
}

async function deleteCustomer(req, res) {
    try {
        const deleted = await customerService.deleteCustomer(
            req.params.id
        );

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        res.json({
            success: true,
            message: "Customer deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to delete customer",
            error: error.message
        });
    }
}

module.exports = {
    createCustomer,
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer
};