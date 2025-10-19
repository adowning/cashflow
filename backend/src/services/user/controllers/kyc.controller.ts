// middlewares
import type { AuthRequest } from "@middlewares/auth";
import type { Response } from "express";
import httpStatus from "http-status";
// service
import currencyService from "#/modulesV2/finance/services/currency.service";
// utils
import ApiError from "#/utils/ApiError";
import catchAsync from "#/utils/catchAsync";

export const getCurrencies = catchAsync(
	async (_req: AuthRequest, res: Response) => {
		const currencies = await currencyService.getCurrencies();
		return res.send(currencies);
	},
);

export const getEnableCurrencies = catchAsync(
	async (_req: AuthRequest, res: Response) => {
		const currencies = await currencyService.getEnableCurrencies();
		return res.send(currencies);
	},
);

export const createCurrency = catchAsync(
	async (req: AuthRequest, res: Response) => {
		const currencyData = req.body;
		if (await currencyService.nameTaken(currencyData.name)) {
			throw new ApiError(httpStatus.NOT_FOUND, "Currency Name already taken.");
		}

		const currency = await currencyService.createCurrency(currencyData);
		return res.status(httpStatus.CREATED).send(currency);
	},
);

export const getCurrency = catchAsync(
	async (req: AuthRequest, res: Response) => {
		const { currencyId } = req.params;

		const currency = await currencyService.getCurrencyById(currencyId);
		if (currency) {
			return res.send(currency);
		}

		throw new ApiError(httpStatus.NOT_FOUND, "Currency not found");
	},
);

export const updateCurrency = catchAsync(
	async (req: AuthRequest, res: Response) => {
		const { currencyId } = req.params;
		const updateData = req.body;

		const currency = await currencyService.getCurrencyById(currencyId);
		if (!currency) {
			throw new ApiError(httpStatus.BAD_REQUEST, "Currency not found");
		}

		if (updateData.name) {
			if (await currencyService.nameTaken(updateData.name, currencyId)) {
				throw new ApiError(
					httpStatus.BAD_REQUEST,
					"Currency Name already taken",
				);
			}
		}
		const updatedCurrnecy = await currencyService.patchUpdate(
			{ _id: currencyId },
			updateData,
		);
		return res.send(updatedCurrnecy);
	},
);

export const deleteCurrency = catchAsync(
	async (req: AuthRequest, res: Response) => {
		const { currencyId } = req.params;

		const currency = await currencyService.getCurrencyById(currencyId);
		if (!currency) {
			throw new ApiError(httpStatus.BAD_REQUEST, "Currency not found");
		}

		const updatedCurrnecy = await currencyService.deleteCurrency(currencyId);
		return res.status(httpStatus.NO_CONTENT).send(updatedCurrnecy);
	},
);
